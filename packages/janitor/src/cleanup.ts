import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import {
  deleteChannelItem,
  deleteMapsData,
  getChannelItem,
  getOrphanedMapIds,
} from "./dynamodb";

type ClientProps = {
  dynamodbClient: DynamoDBClient;
  s3Client: S3Client;
};

type DeleteChannelProps = ClientProps & {
  channelId: string;
};

export const deleteChannelData = async ({
  channelId,
  dynamodbClient,
  s3Client,
}: DeleteChannelProps) => {
  const channelData = await getChannelItem({ channelId, dynamodbClient });

  if (!channelData.Item) return;

  const { baseMap, currentMap, history } = channelData.Item;

  const historyMapIds = history?.L?.map((m) => m?.S) ?? [];

  // Deduplicate the mapIds
  const mapIds = [
    ...new Set(
      [baseMap?.S, currentMap?.S, ...historyMapIds].filter(Boolean) as string[]
    ),
  ];

  const deleteObjectsCommand = new DeleteObjectsCommand({
    Bucket: process.env.MAPS_BUCKET,
    Delete: { Objects: mapIds.map((id) => ({ Key: `${id}.png` })) },
  });

  const deleteObjectsResult = await s3Client.send(deleteObjectsCommand);

  console.info("Deleted S3 objects", { mapIds }, deleteObjectsResult);

  const deleteItemsResult = await deleteMapsData({ mapIds, dynamodbClient });

  console.info("Deleted Map entries", { mapIds: mapIds }, deleteItemsResult);

  const deleteChannelResult = await deleteChannelItem({
    channelId,
    dynamodbClient,
  });

  console.info("Delete Channel", { channelId }, deleteChannelResult);
};

export const deleteOrphanedMaps = async ({
  dynamodbClient,
  s3Client,
}: ClientProps) => {
  const mapIds = await getOrphanedMapIds(dynamodbClient);

  if (!mapIds.length) return;

  const deleteObjectsCommand = new DeleteObjectsCommand({
    Bucket: process.env.MAPS_BUCKET,
    Delete: { Objects: mapIds.map((id) => ({ Key: `${id}.png` })) },
  });

  const deleteObjectsResult = await s3Client.send(deleteObjectsCommand);

  console.info("Deleted S3 objects", { mapIds }, deleteObjectsResult);

  const deleteItemsResult = await deleteMapsData({ mapIds, dynamodbClient });

  console.info("Deleted Map entries", { mapIds: mapIds }, deleteItemsResult);
};
