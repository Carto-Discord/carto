import type { APIGatewayProxyResult } from "aws-lambda";
import {
  applyTokensToGrid,
  downloadImage,
  validateMapData,
  validateTokenPosition,
  Size,
  Token,
  uploadMap,
} from "@carto/token-utils";
import { nanoid } from "nanoid";

type Event = {
  application_id: string;
  channel_id: string;
  token: string;
  name: string;
  row: number;
  column: string;
  size?: Size;
  color?: string;
};

const ERROR_TITLE = "Token Add error";
const SUCCESS_TITLE = "Token added";

// Hack to make Canvas work on Lambda
if (process.env["LAMBDA_TASK_ROOT"]) {
  process.env["PATH"] =
    process.env["PATH"] + ":" + process.env["LAMBDA_TASK_ROOT"] + "/lib";
  process.env["LD_LIBRARY_PATH"] = process.env["LAMBDA_TASK_ROOT"] + "/lib";
  process.env["PKG_CONFIG_PATH"] = process.env["LAMBDA_TASK_ROOT"] + "/lib";
}

export const handler = async ({
  application_id,
  channel_id,
  token,
  name,
  row,
  column,
  size,
  color,
}: Event): Promise<APIGatewayProxyResult> => {
  const serverError = {
    statusCode: 500,
    body: JSON.stringify({
      application_id,
      token,
      embed: {
        title: ERROR_TITLE,
        description:
          "Map data for this channel is incomplete.\nCreate the map again or [report it](https://www.github.com/carto-discord/carto/issues).",
      },
    }),
  };

  const validation = await validateMapData(channel_id);

  if (validation.statusCode !== 200) {
    if (validation.statusCode === 404) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          application_id,
          token,
          embed: {
            title: ERROR_TITLE,
            description:
              "No map exists for this channel.\nCreate one with the `/map create` command",
          },
        }),
      };
    }

    return serverError;
  }

  const { baseMapData, baseMapFilename, currentMapData } = validation;

  if (!baseMapData.Item || !currentMapData.Item) return serverError;

  const { margin, rows, columns } = baseMapData.Item;
  const { tokens } = currentMapData.Item;

  if (!margin?.M || !rows?.N || !columns?.N || !tokens?.L) return serverError;

  const tokenPositionValid = validateTokenPosition({
    token: { row, column },
    grid: { rows: parseInt(rows.N), columns: parseInt(columns.N) },
  });

  if (!tokenPositionValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: ERROR_TITLE,
          description: `The row or column you entered is out of bounds.\nThis map's bounds are ${rows.N} rows by ${columns.N} columns`,
        },
      }),
    };
  }

  if (!color) color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  if (!size) size = Size.MEDIUM;

  // Add new token onto existing tokens
  const newTokens: Token[] = tokens.L.map((token) => {
    const { name, row, column, color, size } = token.M || {};

    return {
      name: name.S || "",
      row: parseInt(row.N || "0"),
      column: column.S || "",
      color: color.S || "",
      size: parseFloat(size.N || Size.MEDIUM.toString()),
    };
  }).concat({
    name,
    row,
    column,
    color,
    size,
  });

  const baseFilename = `${
    process.env["LAMBDA_TASK_ROOT"] ? "/tmp/" : ""
  }download.png`;

  try {
    await downloadImage(baseMapFilename, baseFilename);
  } catch (error) {
    console.warn(error);
    return {
      statusCode: 404,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: ERROR_TITLE,
          description:
            "Map could not be recreated. Reason: Original map could not be found",
        },
      }),
    };
  }

  const mapId = nanoid();

  const mapBuffer = await applyTokensToGrid({
    baseFilename,
    margin: {
      x: parseFloat(margin.M?.x?.N || "0.0"),
      y: parseFloat(margin.M?.y?.N || "0.0"),
    },
    tokens: newTokens,
  });

  if (!mapBuffer) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: ERROR_TITLE,
          description: "Map could not be created",
        },
      }),
    };
  }

  const successful = await uploadMap({
    buffer: mapBuffer,
    channelId: channel_id,
    mapId,
    tokens: newTokens,
  });

  if (successful) {
    const imageUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${mapId}.png`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: SUCCESS_TITLE,
          description: "Token positions:",
          image: {
            url: imageUrl,
          },
          fields: newTokens.map((token) => ({
            name: token.name,
            value: `${token.column.toUpperCase()}${token.row}`,
            inline: true,
          })),
        },
      }),
    };
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: ERROR_TITLE,
          description:
            "An error occured while creating the new map. Please try again later",
        },
      }),
    };
  }
};