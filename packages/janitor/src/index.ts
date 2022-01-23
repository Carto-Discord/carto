import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { Client } from "discord.js";
import { deleteChannelData, deleteOrphanedMaps } from "./cleanup";
import { getChannels } from "./dynamodb";

export const handler = async () => {
  const client = new Client();

  // Local testing only, ignored in production
  const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://localhost:4566`
    : undefined;
  const dynamodbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    forcePathStyle: true,
    endpoint,
  });

  await client.login(process.env.DISCORD_TOKEN);

  const channelsToFind = await getChannels(dynamodbClient);

  const missingChannels = (
    await Promise.all(
      channelsToFind.map((id) =>
        client.channels
          .fetch(id)
          .then(() => undefined)
          .catch(() => id)
      )
    )
  ).filter(Boolean) as string[];

  console.log("Channels to delete", missingChannels);

  await Promise.all(
    missingChannels.map((channelId) =>
      deleteChannelData({ channelId, dynamodbClient, s3Client }).catch(
        console.warn
      )
    )
  );

  console.log("Deleting orphaned maps");

  await deleteOrphanedMaps({ dynamodbClient, s3Client });
};
