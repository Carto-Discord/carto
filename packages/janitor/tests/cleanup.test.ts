import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  deleteChannelItem,
  deleteMapsData,
  getOrphanedMapIds,
  getChannelItem,
} from "../src/dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { deleteChannelData, deleteOrphanedMaps } from "../src/cleanup";

jest.mock("../src/dynamodb");
jest.spyOn(console, "info").mockImplementation(jest.fn());

const mockGetChannelItem = getChannelItem as jest.MockedFunction<
  typeof getChannelItem
>;
const mockDeleteMapsData = deleteMapsData as jest.MockedFunction<
  typeof deleteMapsData
>;
const mockGetOrphanedMapIds = getOrphanedMapIds as jest.MockedFunction<
  typeof getOrphanedMapIds
>;
const mockDeleteChannelItem = deleteChannelItem as jest.MockedFunction<
  typeof deleteChannelItem
>;

const dynamodbClient = new DynamoDBClient({});
const s3Client = new S3Client({});

const mockDynamodbClient = mockClient(dynamodbClient);
const mockS3Client = mockClient(s3Client);

const defaultProps = { channelId: "123", dynamodbClient, s3Client };

describe("Cleanup functions", () => {
  beforeAll(() => {
    process.env.MAPS_BUCKET = "maps";
  });

  beforeEach(() => {
    mockDynamodbClient.reset();
    mockS3Client.reset();

    jest.clearAllMocks();
  });

  describe("deleteChannelData", () => {
    beforeEach(() => {
      mockGetChannelItem.mockResolvedValue({
        Item: {
          baseMap: { S: "123" },
          currentMap: { S: "123" },
          history: { L: [{ S: "456" }, { S: "789" }] },
        },
        $metadata: {},
      });
      mockDeleteMapsData.mockResolvedValue({ $metadata: {} });
      mockDeleteChannelItem.mockResolvedValue({ $metadata: {} });
    });

    it("should delete all the maps in DynamoDB and S3", async () => {
      await deleteChannelData(defaultProps);

      expect(mockS3Client.call(0).args[0].input).toEqual({
        Bucket: "maps",
        Delete: {
          Objects: [
            { Key: "123/123.png" },
            { Key: "123/456.png" },
            { Key: "123/789.png" },
          ],
        },
      });

      expect(mockDeleteMapsData).toBeCalledWith({
        mapIds: ["123", "456", "789"],
        dynamodbClient,
      });

      expect(mockDeleteChannelItem).toBeCalledWith({
        channelId: defaultProps.channelId,
        dynamodbClient,
      });
    });

    describe("given the channel data has no history", () => {
      beforeEach(() => {
        mockS3Client.on(DeleteObjectsCommand).resolves({});
        mockGetChannelItem.mockResolvedValue({
          Item: { baseMap: { S: "123" }, currentMap: { S: "456" } },
          $metadata: {},
        });
      });

      it("should only delete the baseMap and currentMap", async () => {
        await deleteChannelData(defaultProps);

        expect(mockS3Client.call(0).args[0].input).toEqual({
          Bucket: "maps",
          Delete: { Objects: [{ Key: "123/123.png" }, { Key: "123/456.png" }] },
        });
      });
    });

    describe("given no channel data is found for the id", () => {
      beforeEach(() => {
        mockGetChannelItem.mockResolvedValueOnce({ $metadata: {} });
      });

      it("should return without calling any further functions", async () => {
        await deleteChannelData(defaultProps);

        expect(mockS3Client.calls()).toHaveLength(0);
        expect(mockDynamodbClient.calls()).toHaveLength(0);
      });
    });
  });

  describe("deleteOrphanedMaps", () => {
    beforeEach(() => {
      mockS3Client.on(DeleteObjectsCommand).resolves({});
      mockS3Client.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: "123/1.png",
          },
          {
            Key: "234/2.png",
          },
          {
            Key: "345/3.png",
          },
          {
            Key: "456/4.png",
          },
          {
            Key: "567/5.png",
          },
        ],
      });
      mockDeleteMapsData.mockResolvedValue({ $metadata: {} });
      mockGetOrphanedMapIds.mockResolvedValue(["1", "2", "3"]);
    });

    it("should delete both map objects and items", async () => {
      await deleteOrphanedMaps({ dynamodbClient, s3Client });

      expect(mockS3Client.call(1).args[0].input).toEqual({
        Bucket: "maps",
        Delete: {
          Objects: [
            { Key: "123/1.png" },
            { Key: "234/2.png" },
            { Key: "345/3.png" },
          ],
        },
      });

      expect(mockDeleteMapsData).toBeCalledWith({
        mapIds: ["1", "2", "3"],
        dynamodbClient,
      });
    });

    describe("given no mapIds are orphaned", () => {
      beforeEach(() => {
        mockGetOrphanedMapIds.mockResolvedValue([]);
      });

      it("should not call any S3 functions", async () => {
        await deleteOrphanedMaps({ dynamodbClient, s3Client });

        expect(mockS3Client.calls).toHaveLength(0);
        expect(mockDeleteMapsData).not.toBeCalled();
      });
    });
  });
});
