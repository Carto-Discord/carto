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

type CommonEvent = {
  application_id: string;
  channel_id: string;
  token: string;
  name: string;
};

export type Event =
  | (CommonEvent & {
      action: "move";
      row: number;
      column: string;
    })
  | (CommonEvent & {
      action: "delete";
    });

type ResponseProps = {
  statusCode: number;
  description: string;
};

// Hack to make Canvas work on Lambda
if (process.env["LAMBDA_TASK_ROOT"]) {
  process.env["PATH"] =
    process.env["PATH"] + ":" + process.env["LAMBDA_TASK_ROOT"] + "/lib";
  process.env["LD_LIBRARY_PATH"] = process.env["LAMBDA_TASK_ROOT"] + "/lib";
  process.env["PKG_CONFIG_PATH"] = process.env["LAMBDA_TASK_ROOT"] + "/lib";
}

export const handler = async (event: Event): Promise<APIGatewayProxyResult> => {
  const { application_id, channel_id, token, action, name } = event;

  const ERROR_TITLE = `Token ${action === "move" ? "Move" : "Delete"} error`;
  const SUCCESS_TITLE = `Token ${action === "move" ? "moved" : "deleted"}`;

  const formatResponse = ({
    statusCode,
    description,
  }: ResponseProps): APIGatewayProxyResult => ({
    statusCode,
    body: JSON.stringify({
      application_id,
      token,
      embed: {
        title: ERROR_TITLE,
        description,
        type: "rich",
      },
    }),
  });

  const serverError = formatResponse({
    statusCode: 500,
    description:
      "Map data for this channel is incomplete.\nCreate the map again or [report it](https://www.github.com/carto-discord/carto/issues).",
  });

  const validation = await validateMapData(channel_id);

  if (validation.statusCode !== 200) {
    if (validation.statusCode === 404) {
      return formatResponse({
        statusCode: 404,
        description:
          "No map exists for this channel.\nCreate one with the `/map create` command",
      });
    }

    return serverError;
  }

  const { baseMapData, baseMapFilename, currentMapData } = validation;

  if (!baseMapData.Item || !currentMapData.Item) return serverError;

  const { margin, rows, columns } = baseMapData.Item;
  const { tokens } = currentMapData.Item;

  if (!margin?.M || !rows?.N || !columns?.N || !tokens?.L) return serverError;

  const tokenNames = tokens.L.map(({ M }) => M?.name?.S);

  if (!tokenNames.includes(name)) {
    return formatResponse({
      statusCode: 400,
      description: `Token ${name} not found in map. Token names are case sensitive, so try again or add it using \`/token add\``,
    });
  }

  if (action === "move") {
    const { row, column } = event;
    const tokenPositionValid = validateTokenPosition({
      token: { row, column },
      grid: { rows: parseInt(rows.N), columns: parseInt(columns.N) },
    });

    if (!tokenPositionValid) {
      return formatResponse({
        statusCode: 400,
        description: `The row or column you entered is out of bounds.\nThis map's bounds are ${rows.N} rows by ${columns.N} columns`,
      });
    }
  }

  // Add new token onto existing tokens
  let newTokens: Token[] = tokens.L.map((token) => {
    const {
      name: tokenName,
      row: tokenRow,
      column: tokenColumn,
      color,
      size,
    } = token.M || {};

    const tokenColor = color.S || "";
    const tokenSize = parseFloat(size.N || Size.MEDIUM.toString());

    if (tokenName.S === name) {
      if (action === "move") {
        const { row, column } = event;
        return {
          name,
          row,
          column,
          color: tokenColor,
          size: tokenSize,
        };
      }
    }

    return {
      name: tokenName.S || "",
      row: parseInt(tokenRow.N || "0"),
      column: tokenColumn.S || "",
      color: tokenColor,
      size: tokenSize,
    };
  });

  if (action === "delete") {
    newTokens = newTokens.filter(({ name: tokenName }) => tokenName !== name);
  }

  const baseFilename = `${
    process.env["LAMBDA_TASK_ROOT"] ? "/tmp/" : ""
  }download.png`;

  try {
    await downloadImage(baseMapFilename, baseFilename);
  } catch (error) {
    console.warn(error);
    return formatResponse({
      statusCode: 404,
      description:
        "Map could not be recreated. Reason: Original map could not be found",
    });
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
    return formatResponse({
      statusCode: 500,
      description: "Map could not be created",
    });
  }

  const successful = await uploadMap({
    buffer: mapBuffer,
    channelId: channel_id,
    mapId,
    tokens: newTokens,
  });

  if (successful) {
    const imageUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${mapId}.png`;

    const description = newTokens.length
      ? "Token positions:"
      : "All Tokens removed";

    return {
      statusCode: 200,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: SUCCESS_TITLE,
          description,
          image: {
            url: imageUrl,
          },
          fields: newTokens.map((token) => ({
            name: token.name,
            value: `${token.column.toUpperCase()}${token.row}`,
            inline: true,
          })),
          type: "rich",
        },
      }),
    };
  } else {
    return formatResponse({
      statusCode: 500,
      description:
        "An error occured while creating the new map. Please try again later",
    });
  }
};
