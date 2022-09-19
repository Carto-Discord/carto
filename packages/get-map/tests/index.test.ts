import type { GetItemCommandOutput } from "@aws-sdk/client-dynamodb";

import { handler } from "../src/index";

describe("Handler", () => {
  const event = {
    application_id: "app_id_123",
    channel: {
      Item: {
        id: {
          S: "channelId",
        },
      },
    } as unknown as GetItemCommandOutput,
    map: {
      Item: {
        id: {
          S: "mapId",
        },
        tokens: {
          L: [],
        },
      },
    } as unknown as GetItemCommandOutput,
    token: "mockToken",
  };

  beforeAll(() => {
    process.env.CHANNELS_TABLE = "channels";
    process.env.MAPS_TABLE = "maps";
    process.env.MAPS_BUCKET = "carto-bot-maps";
    process.env.AWS_REGION = "eu-central-1";
  });

  describe("given no tokens are present on the map", () => {
    it("should return just the image url", async () => {
      const response = await handler(event);

      const expectedEmbed = {
        title: "Retrieved map",
        image: {
          url: `https://s3.eu-central-1.amazonaws.com/carto-bot-maps/channelId/mapId.png`,
        },
        fields: [],
        type: "rich",
      };

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

  describe("given tokens are present on the map", () => {
    beforeEach(() => {
      {
        event.map.Item = {
          id: {
            S: "mapId",
          },
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
        };
      }
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

      const expectedEmbed = {
        title: "Retrieved map",
        image: {
          url: `https://s3.eu-central-1.amazonaws.com/carto-bot-maps/channelId/mapId.png`,
        },
        fields: expectedFields,
        type: "rich",
      };

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
