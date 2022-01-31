import type { APIGatewayProxyResult } from "aws-lambda";
import { setupLibraries } from "@carto/map-utils";
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
import { deleteAllTokens } from "./deleteAll";

type CommonEvent = {
  application_id: string;
  channel_id: string;
  token: string;
};

type ResponseProps = {
  statusCode: number;
  description: string;
};

export type Event =
  | (CommonEvent & {
      subCommand: "move";
      name: string;
      row: number;
      column: string;
    })
  | (CommonEvent & {
      subCommand: "delete";
      name?: string;
      all?: boolean;
    });

setupLibraries();

export const handler = async (event: Event): Promise<APIGatewayProxyResult> => {
  const { application_id, channel_id, token, subCommand, name } = event;

  const ERROR_TITLE = `Token ${
    subCommand === "move" ? "Move" : "Delete"
  } error`;
  const SUCCESS_TITLE = `Token ${subCommand === "move" ? "moved" : "deleted"}`;

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
      "Map data for this channel is incomplete.\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.",
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

  if (!margin?.M || !rows?.N || !columns?.N) return serverError;

  if (!tokens?.L)
    return formatResponse({
      statusCode: 404,
      description:
        "No tokens were found on this map. You can add one with `/token add`",
    });

  const tokenNames = tokens.L.map(({ M }) => M?.name?.S);

  if (
    (subCommand === "move" && !name) ||
    (subCommand === "delete" && !name && !event.all)
  ) {
    return formatResponse({
      statusCode: 400,
      description: "You must supply a name with this command",
    });
  }

  if (name && !tokenNames.includes(name)) {
    return formatResponse({
      statusCode: 400,
      description: `Token ${name} not found in map. Token names are case sensitive, so try again or add it using \`/token add\``,
    });
  }

  if (subCommand === "move") {
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

    if (name && tokenName.S === name) {
      if (subCommand === "move") {
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

  if (subCommand === "delete") {
    const { all } = event;

    const baseMapId = baseMapData.Item.id?.S;

    if (all) {
      if (!baseMapId) {
        return formatResponse({
          statusCode: 404,
          description:
            "Map data for this channel is incomplete.\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.",
        });
      }

      await deleteAllTokens({
        baseMapId,
        channelId: channel_id,
      });

      const imageUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${baseMapId}.png`;

      return {
        statusCode: 200,
        body: JSON.stringify({
          application_id,
          token,
          embed: {
            title: SUCCESS_TITLE,
            description: "All Tokens removed",
            image: {
              url: imageUrl,
            },
            type: "rich",
          },
        }),
      };
    }

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
