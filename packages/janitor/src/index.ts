import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { Client, Intents } from "discord.js";
import { deleteChannelData } from "./cleanup";
import { getChannels } from "./dynamodb";

export const handler = async () => {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
  const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    forcePathStyle: true,
  });

  client.login(process.env.DISCORD_TOKEN);

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

  await Promise.all(
    missingChannels.map((channelId) =>
      deleteChannelData({ channelId, dynamodbClient, s3Client }).catch(
        console.warn
      )
    )
  );
};
