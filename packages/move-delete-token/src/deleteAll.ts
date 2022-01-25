import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

type Props = {
  baseMapId: string;
  channelId: string;
};

export const deleteAllTokens = ({ baseMapId, channelId }: Props) => {
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });

  const updateItemCommand = new UpdateItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channelId } },
    UpdateExpression:
      "SET currentMap = :base, #history = list_append(:base, #history)",
    ExpressionAttributeNames: { "#history": "history" },
    ExpressionAttributeValues: {
      ":base": { S: baseMapId },
    },
  });

  return client.send(updateItemCommand);
};
