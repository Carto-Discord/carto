import { APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { nanoid } from "nanoid";

import { createGrid } from "./createGrid";

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
  const mapID = nanoid();

  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const putObjectCommand = new PutObjectCommand({
    Key: `${mapID}.png`,
    Bucket: process.env.MAPS_BUCKET,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
  });

  const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
  const getChannelMapCommand = new GetItemCommand({
    Key: { id: { S: channel_id } },
    TableName: process.env.CHANNELS_TABLE,
  });

  return {
    statusCode: 200,
    body: "",
  };
};
