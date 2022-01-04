import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { MessageEmbed } from "discord.js";

import { handler } from "../src/index";

const dynamoMock = mockClient(DynamoDBClient);

jest.spyOn(console, "warn").mockImplementation(jest.fn());

describe("Handler", () => {
  const event = {
    application_id: "app_id_123",
    channel_id: "123456789",
    token: "mockToken",
  };

  beforeAll(() => {
    process.env.CHANNELS_TABLE = "channels";
    process.env.MAPS_TABLE = "maps";
    process.env.MAPS_BUCKET = "carto-bot-maps";
    process.env.AWS_REGION = "eu-central-1";
  });

  describe("given the channel has no map", () => {
    beforeEach(() => {
      dynamoMock.on(GetItemCommand).resolves({});
    });

    it("should return a 404 status", async () => {
      const response = await handler(event);

      const expectedEmbed = new MessageEmbed({
        title: "Error retrieving map",
        description: "This channel has no map associated with it",
      });

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          token: event.token,
          application_id: event.application_id,
          embed: expectedEmbed,
        }),
      });
    });
  });

  describe("given the channel has no current map", () => {
    beforeEach(() => {
      dynamoMock.on(GetItemCommand).resolves({ Item: {} });
    });

    it("should return a 404 status", async () => {
      const response = await handler(event);

      const expectedEmbed = new MessageEmbed({
        title: "Error retrieving map",
        description: "This channel has no map associated with it",
      });

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          token: event.token,
          application_id: event.application_id,
          embed: expectedEmbed,
        }),
      });
    });
  });

  describe("given map data for the current map is missing", () => {
    beforeEach(() => {
      dynamoMock
        .on(GetItemCommand, {
          TableName: "channels",
          Key: { id: { S: event.channel_id } },
        })
        .resolves({ Item: { currentMap: { S: "map-1234" } } });
      dynamoMock
        .on(GetItemCommand, {
          TableName: "maps",
          Key: { id: { S: "map-1234" } },
        })
        .resolves({});
    });

    it("should return a 500 status", async () => {
      const response = await handler(event);

      const expectedEmbed = new MessageEmbed({
        title: "Error retrieving map",
        description: "Map data in incomplete, please report this to bot admins",
      });

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({
          token: event.token,
          application_id: event.application_id,
          embed: expectedEmbed,
        }),
      });
    });
  });

  describe("given tokens are present on the map", () => {
    beforeEach(() => {
      dynamoMock
        .on(GetItemCommand, {
          TableName: "channels",
          Key: { id: { S: event.channel_id } },
        })
        .resolves({ Item: { currentMap: { S: "map-1234" } } });
      dynamoMock
        .on(GetItemCommand, {
          TableName: "maps",
          Key: { id: { S: "map-1234" } },
        })
        .resolves({
          Item: {
            tokens: {
              L: [
                {
                  M: {
                    colour: { S: "Blue" },
                    column: { S: "C" },
                    name: { S: "token1" },
                    row: { N: "1" },
                    size: { N: "1" },
                  },
                },
                {
                  M: {
                    colour: { S: "Pink" },
                    column: { S: "D" },
                    name: { S: "token2" },
                    row: { N: "4" },
                    size: { N: "2" },
                  },
                },
              ],
            },
          },
        });
    });

    it("should return a list of token names and locations in the response", async () => {
      const response = await handler(event);

      const expectedFields = [
        {
          name: "token1",
          value: "C1",
          inline: true,
        },
        {
          name: "token2",
          value: "D4",
          inline: true,
        },
      ];

      const expectedEmbed = new MessageEmbed({
        title: "Retrieved map",
        fields: expectedFields,
        image: {
          url: "https://s3.eu-central-1.amazonaws.com/carto-bot-maps/map-1234.png",
        },
      });

      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          token: event.token,
          application_id: event.application_id,
          embed: expectedEmbed,
        }),
      });
    });
  });
});
