import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { validateMapData, validateTokenPosition } from "../src/validate";

const dynamodbMock = mockClient(DynamoDBClient);

describe("Validate map data", () => {
  beforeAll(() => {
    process.env.MAPS_TABLE = "carto-bot-maps";
    process.env.CHANNELS_TABLE = "carto-bot-channels";
  });

  beforeEach(() => {
    dynamodbMock.reset();
  });

  describe("given the channel map doesn't exist", () => {
    beforeEach(() => {
      dynamodbMock.on(GetItemCommand).resolves({});
    });

    it("should return a 404 response", async () => {
      const result = await validateMapData("1234");

      expect(result).toEqual({ statusCode: 404 });
    });
  });

  describe("given the channel map is incomplete", () => {
    beforeEach(() => {
      dynamodbMock.on(GetItemCommand).resolves({ Item: {} });
    });

    it("should return a 404 response", async () => {
      const result = await validateMapData("1234");

      expect(result).toEqual({ statusCode: 404 });
    });
  });

  describe("given the base map data doesn't exist", () => {
    beforeEach(() => {
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-channels",
          Key: { id: { S: "1234" } },
        })
        .resolves({
          Item: {
            currentMap: { S: "current-123" },
            baseMap: { S: "base-123" },
          },
        });
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-maps",
          Key: { id: { S: "base-123" } },
        })
        .resolves({});
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-maps",
          Key: { id: { S: "current-123" } },
        })
        .resolves({ Item: {} });
    });

    it("should return a 500 response", async () => {
      const result = await validateMapData("1234");

      expect(result).toEqual({ statusCode: 500 });
    });
  });

  describe("given the current map data doesn't exist", () => {
    beforeEach(() => {
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-channels",
          Key: { id: { S: "1234" } },
        })
        .resolves({
          Item: {
            currentMap: { S: "current-123" },
            baseMap: { S: "base-123" },
          },
        });
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-maps",
          Key: { id: { S: "base-123" } },
        })
        .resolves({ Item: {} });
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-maps",
          Key: { id: { S: "current-123" } },
        })
        .resolves({});
    });

    it("should return a 500 response", async () => {
      const result = await validateMapData("1234");

      expect(result).toEqual({ statusCode: 500 });
    });
  });

  describe("given all data exists", () => {
    beforeEach(() => {
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-channels",
          Key: { id: { S: "1234" } },
        })
        .resolves({
          Item: {
            currentMap: { S: "current-123" },
            baseMap: { S: "base-123" },
          },
        });
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-maps",
          Key: { id: { S: "base-123" } },
        })
        .resolves({ Item: { data: { S: "base-data" } } });
      dynamodbMock
        .on(GetItemCommand, {
          TableName: "carto-bot-maps",
          Key: { id: { S: "current-123" } },
        })
        .resolves({ Item: { data: { S: "current-data" } } });
    });

    it("should return a 200 response", async () => {
      const result = await validateMapData("1234");

      expect(result).toEqual({
        statusCode: 200,
        baseMapData: { Item: { data: { S: "base-data" } } },
        baseMapFilename: "1234/base-123.png",
        currentMapData: { Item: { data: { S: "current-data" } } },
      });
    });
  });
});

describe("Validate token position", () => {
  it.each`
    tokenRow | tokenCol | gridRows | gridCols | valid
    ${1}     | ${"A"}   | ${1}     | ${1}     | ${true}
    ${1}     | ${"A"}   | ${2}     | ${2}     | ${true}
    ${2}     | ${"B"}   | ${1}     | ${1}     | ${false}
    ${50}    | ${"A"}   | ${49}    | ${49}    | ${false}
    ${49}    | ${"AB"}  | ${49}    | ${26}    | ${false}
  `(
    "should validate as $valid",
    ({ valid, tokenRow, tokenCol, gridRows, gridCols }) => {
      expect(
        validateTokenPosition({
          token: { row: tokenRow, column: tokenCol },
          grid: { rows: gridRows, columns: gridCols },
        })
      ).toBe(valid);
    }
  );
});
