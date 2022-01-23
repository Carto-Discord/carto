import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import {
  getChannels,
  getChannelItem,
  deleteChannelItem,
  deleteMapsData,
  getOrphanedMapIds,
} from "../src/dynamodb";

const dynamodbClient = new DynamoDBClient({});
const mockDynamodbClient = mockClient(dynamodbClient);

describe("DynamoDB functions", () => {
  beforeAll(() => {
    process.env.CHANNELS_TABLE = "channels";
    process.env.MAPS_TABLE = "maps";
  });

  beforeEach(() => {
    mockDynamodbClient.reset();
  });

  describe("getChannels", () => {
    beforeEach(() => {
      mockDynamodbClient
        .on(ScanCommand)
        .resolves({ Items: [{ id: { S: "123" } }, { id: { S: "456" } }] });
    });

    it("should return a list of channel IDs", async () => {
      const result = await getChannels(dynamodbClient);

      expect(mockDynamodbClient.call(0).args[0].input).toEqual({
        TableName: "channels",
      });
      expect(result).toEqual(["123", "456"]);
    });

    describe("given some items have no ID", () => {
      beforeEach(() => {
        mockDynamodbClient
          .on(ScanCommand)
          .resolves({ Items: [{ id: { S: "123" } }, {}] });
      });

      it("should return an empty map", async () => {
        const result = await getChannels(dynamodbClient);

        expect(result).toEqual(["123"]);
      });
    });

    describe("given the scan fails", () => {
      beforeEach(() => {
        mockDynamodbClient.on(ScanCommand).resolves({});
      });

      it("should return an empty map", async () => {
        const result = await getChannels(dynamodbClient);

        expect(result).toEqual([]);
      });
    });
  });

  describe("getChannelItem", () => {
    beforeEach(() => {
      mockDynamodbClient.on(GetItemCommand).resolves({ Item: {} });
    });

    it("should get the item with the channelId key", async () => {
      const result = await getChannelItem({ channelId: "123", dynamodbClient });

      expect(mockDynamodbClient.call(0).args[0].input).toEqual({
        TableName: "channels",
        Key: { id: { S: "123" } },
      });
      expect(result).toEqual({ Item: {} });
    });
  });

  describe("deleteChannelItem", () => {
    beforeEach(() => {
      mockDynamodbClient.on(DeleteItemCommand).resolves({});
    });

    it("should delete the item with the channelId key", async () => {
      await deleteChannelItem({ channelId: "123", dynamodbClient });

      expect(mockDynamodbClient.call(0).args[0].input).toEqual({
        TableName: "channels",
        Key: { id: { S: "123" } },
      });
    });
  });

  describe("getOrphanedMapIds", () => {
    beforeEach(() => {
      mockDynamodbClient.on(ScanCommand, { TableName: "channels" }).resolves({
        Items: [
          {
            baseMap: { S: "1" },
            currentMap: { S: "2" },
            history: { L: [{ S: "3" }, { S: "4" }] },
          },
          {
            baseMap: { S: "5" },
            currentMap: { S: "6" },
            history: { L: [{ S: "7" }, { S: "8" }] },
          },
          {
            baseMap: { S: "9" },
            currentMap: { S: "0" },
          },
        ],
      });

      const mapIds = Array(15)
        .fill(0)
        .map((_, i) => i);

      mockDynamodbClient.on(ScanCommand, { TableName: "maps" }).resolves({
        Items: mapIds.map((id) => ({ id: { S: id.toString() } })),
      });
    });

    it("should return the map IDs not present in the channels", async () => {
      const ids = await getOrphanedMapIds(dynamodbClient);

      expect(ids).toEqual(["10", "11", "12", "13", "14"]);
    });

    describe("given the channel scan command fails", () => {
      beforeEach(() => {
        mockDynamodbClient
          .on(ScanCommand, { TableName: "channels" })
          .resolves({ $metadata: {} });
      });

      it("should return an empty array", async () => {
        const ids = await getOrphanedMapIds(dynamodbClient);

        expect(ids).toEqual([]);
      });
    });

    describe("given the map scan command fails", () => {
      beforeEach(() => {
        mockDynamodbClient
          .on(ScanCommand, { TableName: "maps" })
          .resolves({ $metadata: {} });
      });

      it("should return an empty array", async () => {
        const ids = await getOrphanedMapIds(dynamodbClient);

        expect(ids).toEqual([]);
      });
    });
  });

  describe("deleteMapsData", () => {
    beforeEach(() => {
      mockDynamodbClient.on(BatchWriteItemCommand).resolves({});
    });

    it("should delete all the items in the maps key", async () => {
      await deleteMapsData({ mapIds: ["123", "456"], dynamodbClient });

      expect(mockDynamodbClient.call(0).args[0].input).toEqual({
        RequestItems: {
          maps: [
            { DeleteRequest: { Key: { id: { S: "123" } } } },
            { DeleteRequest: { Key: { id: { S: "456" } } } },
          ],
        },
      });
    });
  });
});
