import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

type GetChannelProps = {
  channelId: string;
  dynamodbClient: DynamoDBClient;
};

type GetMapsProps = {
  mapIds: string[];
  dynamodbClient: DynamoDBClient;
};

export const getChannels = async (client: DynamoDBClient) => {
  const scanCommand = new ScanCommand({
    TableName: process.env.CHANNELS_TABLE,
  });

  const channels = await client.send(scanCommand);

  return (
    (channels?.Items?.map(({ id }) => id?.S).filter(Boolean) as string[]) ?? []
  );
};

export const getChannelItem = ({
  channelId,
  dynamodbClient,
}: GetChannelProps) => {
  const getItemCommand = new GetItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channelId } },
  });

  return dynamodbClient.send(getItemCommand);
};

export const deleteChannelItem = ({
  channelId,
  dynamodbClient,
}: GetChannelProps) => {
  const deleteItemCommand = new DeleteItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channelId } },
  });

  return dynamodbClient.send(deleteItemCommand);
};

export const getOrphanedMapIds = async (client: DynamoDBClient) => {
  const channelScanCommand = new ScanCommand({
    TableName: process.env.CHANNELS_TABLE,
  });

  const channels = await client.send(channelScanCommand);

  if (!channels.Items) return [];

  // Deduped map IDs
  const usedMapIds = [
    ...new Set(
      channels.Items.reduce((acc, channel) => {
        const { baseMap, currentMap, history } = channel;

        const ids = [
          baseMap?.S,
          currentMap?.S,
          ...(history?.L?.map((m) => m?.S) ?? []),
        ].filter(Boolean) as string[];

        return acc.concat(ids);
      }, [] as string[]) ?? []
    ),
  ];

  const mapScanCommand = new ScanCommand({
    TableName: process.env.MAPS_TABLE,
  });

  const maps = await client.send(mapScanCommand);

  // All map IDs in the table
  const allMapIds =
    (maps?.Items?.map(({ id }) => id?.S).filter(Boolean) as string[]) ?? [];

  return allMapIds.filter((i) => !usedMapIds.includes(i));
};

export const deleteMapsData = ({ mapIds, dynamodbClient }: GetMapsProps) => {
  const deleteItemsCommand = new BatchWriteItemCommand({
    RequestItems: {
      [process.env.MAPS_TABLE]: mapIds.map((id) => ({
        DeleteRequest: { Key: { id: { S: id } } },
      })),
    },
  });

  return dynamodbClient.send(deleteItemsCommand);
};
