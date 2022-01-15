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

    const history = [];
    let baseMap = mapId;
    if (channelMap.Item) {
      const prevMap = channelMap.Item.currentMap;
      const prevHistory = channelMap.Item.history.L || [];

      if (!isBase) baseMap = channelMap.Item?.baseMap?.S ?? mapId;

      history.push(prevMap, ...prevHistory);
    }

    const updateChannelMapCommand = new UpdateItemCommand({
      Key: { id: { S: channelId } },
      TableName: process.env.CHANNELS_TABLE,
      UpdateExpression:
        "SET currentMap = :current, history = :history, baseMap = :base",
      ExpressionAttributeValues: {
        ":base": { S: baseMap },
        ":current": { S: mapId },
        ":history": { L: history },
      },
    });

    return client.send(updateChannelMapCommand);
  };
