import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

import { deleteAllTokens } from "../src/deleteAll";

const mockDynamodbClient = mockClient(DynamoDBClient);

describe("Delete All Tokens", () => {
  beforeAll(() => {
    process.env.AWS_REGION = "eu-central-1";
    process.env.CHANNELS_TABLE = "channels";
  });

  beforeEach(() => {
    mockDynamodbClient.on(UpdateItemCommand).resolves({ $metadata: {} });
  });

  it("should call the UpdateItemCommand", async () => {
    await deleteAllTokens({ baseMapId: "123", channelId: "456" });

    expect(mockDynamodbClient.call(0).args[0].input).toEqual({
      TableName: "channels",
      Key: { id: { S: "456" } },
      UpdateExpression:
        "SET currentMap = :base, #history = list_append(:base, #history)",
      ExpressionAttributeNames: { "#history": "history" },
      ExpressionAttributeValues: {
        ":base": { L: [{ S: "123" }] },
      },
    });
  });
});
