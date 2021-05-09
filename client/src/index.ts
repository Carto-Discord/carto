import { Snowflake } from "discord.js";
import dotenv from "dotenv";
import {
  ApplicationCommandInteractionDataOption,
  InteractionResponseType,
  InteractionType,
  Interaction,
} from "slash-commands";
import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";
import { createMap, CreateProps } from "./create";
import { getMap } from "./get";
import {
  AddProps,
  addToken,
  DeleteProps,
  deleteToken,
  MoveProps,
  moveToken,
} from "./token";
import { validateRequest } from "./validation";
import { CommandGroup, SubCommand, CommandOptions } from "./types";

dotenv.config();

type CommandProps = {
  command: ApplicationCommandInteractionDataOption;
  channelId: Snowflake;
  token: string;
  applicationId: Snowflake;
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

const handleMapCommands = ({
  applicationId,
  channelId,
  command,
  token,
}: CommandProps) => {
  // We can be confident that each subcommand will have the correct parameters,
  // as this is type checked by Discord before reaching here.
  switch (command.name) {
    case SubCommand.MAP_CREATE:
      console.log("Received creation request");
      const { url, rows, columns } = extractParameters<CreateProps>(command);

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
      ({ name, row, column, colour, size } = extractParameters<AddProps>(
        command
      ));

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

export const slashFunction: HttpFunction = (req, res) => {
  const isVerified = validateRequest(req);

  if (!isVerified) {
    return res.status(401).end("invalid request signature");
  }

  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const body: Interaction = req.body;

  if (body.type === InteractionType.PING) {
    res.status(200).json({ type: InteractionResponseType.PONG }).end();
    return;
  }

  const commandGroup = body.data;

  let channel_id: Snowflake, token: string, application_id: Snowflake;
  if ("channel_id" in body) {
    ({ channel_id, token, application_id } = body);
  }

  if ("options" in commandGroup) {
    switch (commandGroup.name) {
      case CommandGroup.MAP:
        handleMapCommands({
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
  }

  res
    .status(200)
    .json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    })
    .end();
};
