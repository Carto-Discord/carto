import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

import { mockClient } from "aws-sdk-client-mock";

import { createGrid } from "../src/createGrid";
import { handler } from "../src/index";

jest.mock("@carto/map-utils", () => ({
  updateChannelBaseMap: () => () => Promise.resolve({}),
  setupLibraries: jest.fn(),
}));
jest.mock("../src/createGrid");

const mockS3Client = mockClient(S3Client);
const mockDynamoClient = mockClient(DynamoDBClient);

const mockCreateGrid = createGrid as jest.MockedFunction<typeof createGrid>;

jest.spyOn(console, "warn").mockImplementation(jest.fn());

describe("Handler", () => {
  const defaultProps = {
    application_id: "1234",
    channel_id: "4567",
    token: "mockToken",
    url: "https://some.image.url",
    rows: 8,
    columns: 10,
  };

  beforeAll(() => {
    process.env.AWS_REGION = "eu-central-1";
    process.env.MAPS_BUCKET = "maps";
  });

  beforeEach(() => {
    mockS3Client.reset();
    mockDynamoClient.reset();
  });

  describe("given grid data is not returned", () => {
    beforeEach(() => {
      mockCreateGrid.mockResolvedValue(undefined);
    });

    it("should return a 404 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Map create error",
            description:
              "URL https://some.image.url could not be found.\nMake sure it is public and includes the file extension",
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given grid data is returned", () => {
    const buffer = Buffer.from("hello", "base64");
    const margin = {
      x: 20,
      y: 30,
    };

    beforeEach(() => {
      mockCreateGrid.mockResolvedValue({
        buffer,
        margin,
      });

      mockS3Client.on(PutObjectCommand).resolves({});
      mockDynamoClient.on(PutItemCommand).resolves({});
    });

    it("should upload the file to S3", async () => {
      await handler(defaultProps);

      expect(mockS3Client.call(0).args[0].input).toEqual({
        Key: expect.stringMatching(/.*.png/),
        Bucket: "maps",
        Body: buffer,
        ContentEncoding: "base64",
        ContentType: "image/png",
      });
    });

    it("should put the item into DynamoDB", async () => {
      await handler(defaultProps);

      expect(mockDynamoClient.call(0).args[0].input).toEqual({
        TableName: process.env.MAPS_TABLE,
        Item: {
          id: { S: expect.any(String) },
          url: { S: defaultProps.url },
          rows: { N: defaultProps.rows.toString() },
          columns: { N: defaultProps.columns.toString() },
          margin: {
            M: { x: { N: margin.x.toString() }, y: { N: margin.y.toString() } },
          },
        },
      });
    });

    it("should return a 200 response", async () => {
      const response = await handler(defaultProps);

      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);

      expect(body).toEqual({
        application_id: defaultProps.application_id,
        token: defaultProps.token,
        embed: {
          title: "Map created",
          fields: [
            { name: "Rows", value: defaultProps.rows, inline: true },
            { name: "Columns", value: defaultProps.columns, inline: true },
          ],
          image: {
            url: expect.stringMatching(
              /https:\/\/s3.eu-central-1.amazonaws.com\/maps\/.*.png$/
            ),
          },
          type: "rich",
        },
      });
    });

    describe("given the file upload fails", () => {
      beforeEach(() => {
        mockS3Client
          .on(PutObjectCommand)
          .rejects(new Error("Something went wrong"));
      });

      it("should return a 500 response", async () => {
        const response = await handler(defaultProps);

        expect(response).toEqual({
          statusCode: 500,
          body: JSON.stringify({
            application_id: defaultProps.application_id,
            token: defaultProps.token,
            embed: {
              title: "Map create error",
              description:
                "Map data could not be saved due to an internal error.\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.",
              type: "rich",
            },
          }),
        });
      });
    });
  });
});
