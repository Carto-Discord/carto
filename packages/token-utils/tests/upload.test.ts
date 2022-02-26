import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { updateChannelBaseMap } from "@carto/map-utils";
import { mockClient } from "aws-sdk-client-mock";
import { Size } from "../src/token";

import { uploadMap } from "../src/upload";

jest.mock("@carto/map-utils");
jest.spyOn(console, "warn").mockImplementation(jest.fn());

const mockS3Client = mockClient(S3Client);
const mockDynamodbClient = mockClient(DynamoDBClient);

const mockUpdateChannelBaseMap = updateChannelBaseMap as jest.MockedFunction<
  typeof updateChannelBaseMap
>;

describe("Upload Map", () => {
  const buffer = Buffer.from("hello world", "base64");
  const channelId = "1234567890";
  const mapId = "abcdefg";
  const tokens = [
    {
      name: "token1",
      row: 8,
      column: "B",
      color: "#ffffff",
      size: Size.LARGE,
    },
    {
      name: "token2",
      row: 7,
      column: "C",
      color: "#ff00ff",
      size: Size.TINY,
    },
  ];

  beforeAll(() => {
    process.env.MAPS_BUCKET = "maps";
    process.env.MAPS_TABLE = "maps";
  });

  beforeEach(() => {
    mockS3Client.reset();
    mockDynamodbClient.reset();

    mockS3Client.on(PutObjectCommand).resolves({});
    mockDynamodbClient.on(PutItemCommand).resolves({});
    mockUpdateChannelBaseMap.mockReturnValue(() =>
      Promise.resolve({ $metadata: {} })
    );
  });

  it("should call AWS SDKs with correct value", async () => {
    await expect(
      uploadMap({
        buffer,
        channelId,
        mapId,
        tokens,
      })
    ).resolves.toBe(true);

    expect(mockS3Client.call(0).args[0].input).toEqual({
      Key: "1234567890/abcdefg.png",
      Bucket: "maps",
      Body: buffer,
      ContentEncoding: "base64",
      ContentType: "image/png",
    });

    expect(mockDynamodbClient.call(0).args[0].input).toEqual({
      TableName: "maps",
      Item: {
        id: { S: "abcdefg" },
        tokens: {
          L: [
            {
              M: {
                name: { S: "token1" },
                row: { N: "8" },
                column: { S: "B" },
                color: { S: "#ffffff" },
                size: { N: "2" },
              },
            },
            {
              M: {
                name: { S: "token2" },
                row: { N: "7" },
                column: { S: "C" },
                color: { S: "#ff00ff" },
                size: { N: "0" },
              },
            },
          ],
        },
      },
    });
  });

  describe("given the S3 upload fails", () => {
    beforeEach(() => {
      mockS3Client
        .on(PutObjectCommand)
        .rejects(new Error("Something went wrong"));
    });

    it("should return false", async () =>
      expect(
        uploadMap({
          buffer,
          channelId,
          mapId,
          tokens,
        })
      ).resolves.toBe(false));
  });

  describe("given the DB update fails", () => {
    beforeEach(() => {
      mockUpdateChannelBaseMap.mockReturnValue(() =>
        Promise.reject(new Error("Something went wrong"))
      );
    });

    it("should return false", async () =>
      expect(
        uploadMap({
          buffer,
          channelId,
          mapId,
          tokens,
        })
      ).resolves.toBe(false));
  });

  describe("given the Put Item command fails", () => {
    beforeEach(() => {
      mockDynamodbClient
        .on(PutItemCommand)
        .rejects(new Error("Something went wrong"));
    });

    it("should return false", async () =>
      expect(
        uploadMap({
          buffer,
          channelId,
          mapId,
          tokens,
        })
      ).resolves.toBe(false));
  });
});
