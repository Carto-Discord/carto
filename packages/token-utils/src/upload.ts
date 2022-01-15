import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { updateChannelBaseMap } from "@carto/map-utils";
import { Token } from "./token";

type UploadMapProps = {
  buffer: Buffer;
  channelId: string;
  mapId: string;
  tokens: Token[];
};

export const uploadMap = async ({
  buffer,
  channelId,
  mapId,
  tokens,
}: UploadMapProps) => {
  // Local testing only, ignored in production
  const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://localhost:4566`
    : undefined;

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint,
    forcePathStyle: true,
  });
  const dynamodbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });

  const putObjectCommand = new PutObjectCommand({
    Key: `${mapId}.png`,
    Bucket: process.env.MAPS_BUCKET,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
  });
  const putItemCommand = new PutItemCommand({
    TableName: process.env.MAPS_TABLE,
    Item: {
      id: { S: mapId },
      tokens: {
        L: tokens.map((t) => ({
          M: {
            name: { S: t.name },
            row: { N: t.row.toString() },
            column: { S: t.column },
            color: { S: t.color },
            size: { N: t.size.toString() },
          },
        })),
      },
    },
  });

  try {
    await s3Client.send(putObjectCommand);
    await updateChannelBaseMap(dynamodbClient)({
      channelId,
      isBase: false,
      mapId,
    });
    await dynamodbClient.send(putItemCommand);

    return true;
  } catch (error) {
    console.warn(error);
    return false;
  }
};
