import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

type UpdateProps = {
  channelId: string;
  isBase?: boolean;
  mapId: string;
};

export const updateChannelBaseMap =
  (client: DynamoDBClient) =>
  async ({ channelId, isBase, mapId }: UpdateProps) => {
    const getChannelMapCommand = new GetItemCommand({
      Key: { id: { S: channelId } },
      TableName: process.env.CHANNELS_TABLE,
    });

    const channelMap = await client.send(getChannelMapCommand);

    let baseMap = mapId;
    if (channelMap.Item && !isBase) {
      baseMap = channelMap.Item?.baseMap?.S ?? mapId;
    }

    const updateChannelMapCommand = channelMap?.Item
      ? new UpdateItemCommand({
          Key: { id: { S: channelId } },
          TableName: process.env.CHANNELS_TABLE,
          UpdateExpression:
            "SET currentMap = :current, #history = list_append(:newHist, #history), baseMap = :base",
          ExpressionAttributeNames: { "#history": "history" },
          ExpressionAttributeValues: {
            ":base": { S: baseMap },
            ":current": { S: mapId },
            ":newHist": { L: [{ S: mapId }] },
          },
        })
      : new UpdateItemCommand({
          Key: { id: { S: channelId } },
          TableName: process.env.CHANNELS_TABLE,
          UpdateExpression:
            "SET currentMap = :current, history = :history, baseMap = :base",
          ExpressionAttributeValues: {
            ":base": { S: baseMap },
            ":current": { S: mapId },
            ":history": { L: [] },
          },
        });

    return client.send(updateChannelMapCommand);
  };
