import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

type Props = {
  baseMapId: string;
  channelId: string;
};

export const deleteAllTokens = ({ baseMapId, channelId }: Props) => {
  // Local testing only, ignored in production
  const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://localhost:4566`
    : undefined;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });

  const updateItemCommand = new UpdateItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channelId } },
    UpdateExpression:
      "SET currentMap = :current, #history = list_append(:base, #history)",
    ExpressionAttributeNames: { "#history": "history" },
    ExpressionAttributeValues: {
      ":current": { S: baseMapId },
      ":base": { L: [{ S: baseMapId }] },
    },
  });

  return client.send(updateItemCommand);
};
