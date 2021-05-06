import FormData from "form-data";
import fs from "fs";
import { Snowflake } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
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
import { validateRequest } from "./utils/validation";
import { CommandGroup, SubCommand, CommandOptions } from "./types";
import { TokenResponse } from "./utils/requestHandler";

dotenv.config();

type UpdatedResponse = {
  fileName?: string;
  message: string;
};

type CommandProps = {
  command: ApplicationCommandInteractionDataOption;
  channelId: string;
  respond: (response: UpdatedResponse) => void;
};

const updateResponse = (applicationId: string, interactionToken: string) => ({
  fileName,
  message,
}: UpdatedResponse) => {
  const formData = new FormData();
  fileName && formData.append("file", fs.createReadStream(fileName));
  formData.append("comment", message);

  fetch(
    `https://discord.com/api/v8/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: "PATCH",
      body: formData,
    }
  );
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
  command,
  channelId,
  respond,
}: CommandProps) => {
  let response: TokenResponse;

  // We can be confident that each subcommand will have the correct parameters,
  // as this is type checked by Discord before reaching here.
  switch (command.name) {
    case SubCommand.MAP_CREATE:
      console.log("Received creation request");
      const { url, rows, columns } = extractParameters<CreateProps>(command);

      response = await createMap({
        url,
        rows,
        columns,
        channelId,
      });

      response.success
        ? respond({ fileName: response.body, message: "Map created" })
        : respond({ message: response.body });
      break;

    case SubCommand.MAP_GET:
      console.log("Received Map get request");
      response = await getMap({ channelId });

      response.success
        ? respond({ fileName: response.body, message: "Map retrieved" })
        : respond({ message: response.body });
      break;

    default:
      break;
  }
};

const handleTokenCommands = async ({
  command,
  channelId,
  respond,
}: CommandProps) => {
  let response: TokenResponse;
  let name, row, column, colour, size;

  // We can be confident that each subcommand will have the correct parameters,
  // as this is type checked by Discord before reaching here.
  switch (command.name) {
    case SubCommand.TOKEN_ADD:
      console.log("Received token creation request");
      ({ name, row, column, colour, size } = extractParameters<AddProps>(
        command
      ));

      response = await addToken({
        name,
        row,
        column,
        colour,
        size,
        channelId,
      });

      response.success
        ? respond({
            fileName: response.body,
            message: `Token ${name} added to ${column}${row}`,
          })
        : respond({ message: response.body });
      break;

    case SubCommand.TOKEN_MOVE:
      console.log("Received token move request");
      ({ name, row, column } = extractParameters<MoveProps>(command));
      response = await moveToken({ name, row, column, channelId });

      response.success
        ? respond({
            fileName: response.body,
            message: `Token ${name} moved to ${column}${row}`,
          })
        : respond({ message: response.body });
      break;

    case SubCommand.TOKEN_DELETE:
      console.log("Received token deletion request");
      ({ name } = extractParameters<DeleteProps>(command));
      response = await deleteToken({ name, channelId });

      response.success
        ? respond({
            fileName: response.body,
            message: `Token ${name} deleted`,
          })
        : respond({ message: response.body });
      break;

    default:
      break;
  }
};

export const slashFunction: HttpFunction = async (req, res) => {
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

  const commandGroup = body.data.options[0];

  let channel_id: Snowflake, application_id: string, token: string;
  if ("channel_id" in body) {
    ({ channel_id, application_id, token } = body);
  }

  const respond = updateResponse(application_id, token);

  res
    .status(200)
    .json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    })
    .end();

  if ("options" in commandGroup) {
    switch (commandGroup.name) {
      case CommandGroup.MAP:
        await handleMapCommands({
          command: commandGroup.options[0],
          channelId: channel_id,
          respond,
        });
        break;

      case CommandGroup.TOKEN:
        await handleTokenCommands({
          command: commandGroup.options[0],
          channelId: channel_id,
          respond,
        });
        break;

      default:
        break;
    }
  }
};
