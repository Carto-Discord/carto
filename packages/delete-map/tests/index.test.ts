import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

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
    process.env.AWS_REGION = "eu-central-1";
  });

  describe("given the channel cannot be deleted", () => {
    beforeEach(() => {
      dynamoMock
        .on(DeleteItemCommand)
        .rejects(new Error("Something went wrong"));
    });

    it("should return a 404 status", async () => {
      const response = await handler(event);

      const expectedEmbed = {
        title: "Deletion error",
        description:
          "Data couldn't be deleted, likely because it never existed",
        type: "rich",
      };

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          application_id: event.application_id,
          token: event.token,
          embed: expectedEmbed,
        }),
      });
    });
  });

  describe("given the channel can be deleted", () => {
    beforeEach(() => {
      dynamoMock.on(DeleteItemCommand).resolves({});
    });

    it("should return a 200 status", async () => {
      const response = await handler(event);

      const expectedEmbed = {
        title: "Channel data deleted",
        description:
          "All related maps will be erased from Carto within 24 hours",
        type: "rich",
      };

      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          application_id: event.application_id,
          token: event.token,
          embed: expectedEmbed,
        }),
      });
    });
  });
});
