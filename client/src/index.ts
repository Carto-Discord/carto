import {
  ApplicationCommandInteractionDataOption,
  Interaction,
} from "slash-commands";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createMap, CreateProps } from "./create.js";
import { getMap } from "./get.js";
import {
  AddProps,
  addToken,
  DeleteProps,
  deleteToken,
  MoveProps,
  moveToken,
} from "./token.js";
import { validateRequest } from "./validation.js";
import { deleteChannel } from "./delete.js";
import {
  CommandGroup,
  SubCommand,
  CommandOptions,
  InteractionResponseType,
  InteractionType,
} from "./types.js";

type CommandProps = {
  applicationId: string;
  channelId: string;
  command: ApplicationCommandInteractionDataOption;
  token: string;
};

const extractParameters = <T extends CommandOptions>(
  command: ApplicationCommandInteractionDataOption
) => {
  if ("options" in command) {
    return command.options.reduce((acc, o) => {
      if ("value" in o) acc[o.name] = o.value;
      return acc;
    }, {} as T);
  }
};

const handleMapCommands = async ({
  applicationId,
  channelId,
  command,
  token,
}: CommandProps) => {
  let url: string, rows: number, columns: number;

  // We can be confident that each subcommand will have the correct parameters,
  // as this is type checked by Discord before reaching here.
  switch (command.name) {
    case SubCommand.MAP_CREATE:
      console.log("Received creation request");

      ({ url, rows, columns } = extractParameters<CreateProps>(command));

      createMap({
        applicationId,
        channelId,
        columns,
        rows,
        token,
        url,
      });
      break;

    case SubCommand.MAP_GET:
      console.log("Received Map get request");
      getMap({ applicationId, channelId, token });
      break;

    case SubCommand.MAP_DELETE:
      console.log("Received Map deletion request");
      deleteChannel({
        applicationId,
        channelId,
        token,
      });
      break;

    default:
      break;
  }
};

const handleTokenCommands = ({
  applicationId,
  channelId,
  command,
  token,
}: CommandProps) => {
  let name, row, column, colour, size;

  // We can be confident that each subcommand will have the correct parameters,
  // as this is type checked by Discord before reaching here.
  switch (command.name) {
    case SubCommand.TOKEN_ADD:
      console.log("Received token creation request");
      ({ name, row, column, colour, size } =
        extractParameters<AddProps>(command));

      addToken({
        applicationId,
        channelId,
        column,
        colour,
        name,
        row,
        size,
        token,
      });
      break;

    case SubCommand.TOKEN_MOVE:
      console.log("Received token move request");
      ({ name, row, column } = extractParameters<MoveProps>(command));
      moveToken({ applicationId, column, channelId, name, row, token });
      break;

    case SubCommand.TOKEN_DELETE:
      console.log("Received token deletion request");
      ({ name } = extractParameters<DeleteProps>(command));
      deleteToken({ applicationId, channelId, name, token });
      break;

    default:
      break;
  }
};

export const slashFunction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "",
    };
  }

  const isVerified = validateRequest(event);

  if (!isVerified) {
    return {
      statusCode: 401,
      body: "invalid request signature",
    };
  }

  const body: Interaction = JSON.parse(event.body);

  if (body.type === InteractionType.PING) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: InteractionResponseType.PONG }),
    };
  }

  const commandGroup = body.data;

  let channel_id: string, token: string, application_id: string;
  if ("channel_id" in body) {
    ({ channel_id, token, application_id } = body);
  }

  if ("options" in commandGroup) {
    switch (commandGroup.name) {
      case CommandGroup.MAP:
        await handleMapCommands({
          applicationId: application_id,
          channelId: channel_id,
          command: commandGroup.options[0],
          token,
        });
        break;

      case CommandGroup.TOKEN:
        handleTokenCommands({
          applicationId: application_id,
          channelId: channel_id,
          command: commandGroup.options[0],
          token,
        });
        break;

      default:
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      }),
    };
  }
};
