import { APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

import { nanoid } from "nanoid";

import { createGrid } from "./createGrid";
import { updateChannelBaseMap, setupLibraries } from "@carto/map-utils";

type Event = {
  application_id: string;
  channel_id: string;
  token: string;
  url: string;
  rows: number;
  columns: number;
};

const ERROR_TITLE = "Map create error";
const SUCCESS_TITLE = "Map created";

setupLibraries();

export const handler = async ({
  application_id,
  channel_id,
  token,
  url,
  rows,
  columns,
}: Event): Promise<APIGatewayProxyResult> => {
  const gridData = await createGrid({ url, rows, columns });

  if (!gridData) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: ERROR_TITLE,
          description: `URL ${url} could not be found.\nMake sure it is public and includes the file extension`,
          type: "rich",
        },
      }),
    };
  }

  const { buffer, margin } = gridData;
  const mapId = nanoid();

  // Local testing only, ignored in production
  const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://localhost:4566`
    : undefined;

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint,
    forcePathStyle: true,
  });
  const putObjectCommand = new PutObjectCommand({
    Key: `${mapId}.png`,
    Bucket: process.env.MAPS_BUCKET,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
  });

  const dynamodbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });
  const putItemCommand = new PutItemCommand({
    TableName: process.env.MAPS_TABLE,
    Item: {
      id: { S: mapId },
      url: { S: url },
      rows: { N: rows.toString() },
      columns: { N: columns.toString() },
      margin: {
        M: { x: { N: margin.x.toString() }, y: { N: margin.y.toString() } },
      },
    },
  });

  try {
    await s3Client.send(putObjectCommand);
    await updateChannelBaseMap(dynamodbClient)({
      channelId: channel_id,
      isBase: true,
      mapId,
    });
    await dynamodbClient.send(putItemCommand);
  } catch (e) {
    console.warn(e);

    return {
      statusCode: 500,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: ERROR_TITLE,
          description: `Map data could not be saved due to an internal error.\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.`,
          type: "rich",
        },
      }),
    };
  }

  const imageUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${mapId}.png`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      application_id,
      token,
      embed: {
        title: SUCCESS_TITLE,
        fields: [
          { name: "Rows", value: rows, inline: true },
          { name: "Columns", value: columns, inline: true },
        ],
        image: {
          url: imageUrl,
        },
        type: "rich",
      },
    }),
  };
};
