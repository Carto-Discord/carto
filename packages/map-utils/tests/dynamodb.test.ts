import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { updateChannelBaseMap } from "../src/dynamodb";

const dynamodbClient = new DynamoDBClient({});
const dynamodbMock = mockClient(dynamodbClient);

describe("Update Channel Base Map", () => {
  beforeAll(() => {
    process.env.CHANNELS_TABLE = "channels";
  });

  beforeEach(() => {
    dynamodbMock.reset();
  });

  describe("given the map is a base map", () => {
    describe("given no map exists for the channel", () => {
      beforeEach(() => {
        dynamodbMock.on(GetItemCommand).resolves({});
        dynamodbMock.on(UpdateItemCommand).resolves({});
      });

      it("should update with a new history array", async () => {
        await updateChannelBaseMap(dynamodbClient)({
          channelId: "1234",
          isBase: true,
          mapId: "abcd",
        });

        expect(dynamodbMock.call(0).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
        });
        expect(dynamodbMock.call(1).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
          UpdateExpression:
            "SET currentMap = :current, history = :history, baseMap = :base",
          ExpressionAttributeValues: {
            ":base": { S: "abcd" },
            ":current": { S: "abcd" },
            ":history": { L: [] },
          },
        });
      });
    });

    describe("given a map exists for the channel", () => {
      beforeEach(() => {
        dynamodbMock.on(GetItemCommand).resolves({
          Item: {
            baseMap: { S: "edcba" },
            currentMap: { S: "321" },
            history: { L: [{ S: "567" }, { S: "890" }] },
          },
        });
        dynamodbMock.on(UpdateItemCommand).resolves({});
      });

      it("should update with a modified history array", async () => {
        await updateChannelBaseMap(dynamodbClient)({
          channelId: "1234",
          isBase: true,
          mapId: "abcd",
        });

        expect(dynamodbMock.call(0).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
        });
        expect(dynamodbMock.call(1).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
          UpdateExpression:
            "SET currentMap = :current, history = :history, baseMap = :base",
          ExpressionAttributeValues: {
            ":base": { S: "abcd" },
            ":current": { S: "abcd" },
            ":history": { L: [{ S: "321" }, { S: "567" }, { S: "890" }] },
          },
        });
      });
    });
  });

  describe("given the map is not a base map", () => {
    describe("given no map exists for the channel", () => {
      beforeEach(() => {
        dynamodbMock.on(GetItemCommand).resolves({});
        dynamodbMock.on(UpdateItemCommand).resolves({});
      });

      it("should update with a new history array and a new base map", async () => {
        await updateChannelBaseMap(dynamodbClient)({
          channelId: "1234",
          isBase: false,
          mapId: "abcd",
        });

        expect(dynamodbMock.call(0).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
        });
        expect(dynamodbMock.call(1).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
          UpdateExpression:
            "SET currentMap = :current, history = :history, baseMap = :base",
          ExpressionAttributeValues: {
            ":base": { S: "abcd" },
            ":current": { S: "abcd" },
            ":history": { L: [] },
          },
        });
      });
    });

    describe("given a map exists for the channel", () => {
      beforeEach(() => {
        dynamodbMock.on(GetItemCommand).resolves({
          Item: {
            baseMap: { S: "edcba" },
            currentMap: { S: "321" },
            history: { L: [{ S: "567" }, { S: "890" }] },
          },
        });
        dynamodbMock.on(UpdateItemCommand).resolves({});
      });

      it("should update with a modified history array and the same base map", async () => {
        await updateChannelBaseMap(dynamodbClient)({
          channelId: "1234",
          isBase: false,
          mapId: "abcd",
        });

        expect(dynamodbMock.call(0).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
        });
        expect(dynamodbMock.call(1).args[0].input).toEqual({
          Key: { id: { S: "1234" } },
          TableName: "channels",
          UpdateExpression:
            "SET currentMap = :current, history = :history, baseMap = :base",
          ExpressionAttributeValues: {
            ":base": { S: "edcba" },
            ":current": { S: "abcd" },
            ":history": { L: [{ S: "321" }, { S: "567" }, { S: "890" }] },
          },
        });
      });
    });
  });
});
