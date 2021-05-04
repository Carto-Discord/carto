import { WebhookClient } from "discord.js";
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

const handleMapCommands = async (
  command: ApplicationCommandInteractionDataOption,
  channelId: string,
  client: WebhookClient
) => {
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
        ? client.send("Map created", {
            files: [response.body],
          })
        : client.send(response.body);
      break;

    case SubCommand.MAP_GET:
      console.log("Received Map get request");
      response = await getMap({ channelId });

      response.success
        ? client.send("Map retrieved", {
            files: [response.body],
          })
        : client.send(response.body);
      break;

    default:
      break;
  }
};

const handleTokenCommands = async (
  command: ApplicationCommandInteractionDataOption,
  channelId: string,
  client: WebhookClient
) => {
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
        ? client.send(`Token ${name} added`, {
            files: [response.body],
          })
        : client.send(response.body);
      break;

    case SubCommand.TOKEN_MOVE:
      console.log("Received token move request");
      ({ name, row, column } = extractParameters<MoveProps>(command));
      response = await moveToken({ name, row, column, channelId });

      response.success
        ? client.send(`Token ${name} moved`, {
            files: [response.body],
          })
        : client.send(response.body);
      break;

    case SubCommand.TOKEN_DELETE:
      console.log("Received token deletion request");
      ({ name } = extractParameters<DeleteProps>(command));
      response = await deleteToken({ name, channelId });

      response.success
        ? client.send(`Token ${name} deleted`, {
            files: [response.body],
          })
        : client.send(response.body);
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

  const commandGroup = body.data;
  const { channelId, id, token } = body;

  const client = new WebhookClient(id, token);

  switch (commandGroup.name) {
    case CommandGroup.MAP:
      await handleMapCommands(commandGroup.options[0], channelId, client);
      break;

    case CommandGroup.TOKEN:
      await handleTokenCommands(commandGroup.options[0], channelId, client);
      break;

    default:
      break;
  }

  res.status(200).end();
};
