import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { getColumnNumber } from "@carto/canvas-utils";

type ValidateMapResponse =
  | { statusCode: 404 | 500 }
  | {
      statusCode: 200;
      baseMapData: GetItemCommandOutput;
      baseMapFilename: string;
      currentMapData: GetItemCommandOutput;
    };

type ValidatePositionProps = {
  token: {
    row: number;
    column: string;
  };
  grid: {
    rows: number;
    columns: number;
  };
};

export const validateMapData = async (
  channelId: string
): Promise<ValidateMapResponse> => {
  // Local testing only, ignored in production
  const { LOCALSTACK_HOSTNAME } = process.env;
  const endpoint = LOCALSTACK_HOSTNAME ? `http://localhost:4566` : undefined;

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });
  const getCurrentChannelMapCommand = new GetItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: {
      id: { S: channelId },
    },
  });

  const channelMapData = await client.send(getCurrentChannelMapCommand);

  if (!channelMapData.Item) return { statusCode: 404 };

  const { baseMap, currentMap } = channelMapData.Item;

  const baseMapId = baseMap?.S;
  const currentMapId = currentMap?.S;

  if (!baseMapId || !currentMapId) return { statusCode: 404 };

  const getMapInfoCommand = (mapId: string) =>
    new GetItemCommand({
      TableName: process.env.MAPS_TABLE,
      Key: { id: { S: mapId } },
    });

  const baseMapData = await client.send(getMapInfoCommand(baseMapId));
  const currentMapData = await client.send(getMapInfoCommand(currentMapId));

  if (!baseMapData.Item || !currentMapData.Item) return { statusCode: 500 };

  return {
    statusCode: 200,
    baseMapData,
    baseMapFilename: `${baseMapId}.png`,
    currentMapData,
  };
};

export const validateTokenPosition = ({ token, grid }: ValidatePositionProps) =>
  token.row <= grid.rows && getColumnNumber(token.column) <= grid.columns;
