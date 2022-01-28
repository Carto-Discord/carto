import {
  ApplicationCommandOptionType,
  DiscordInteractions,
  PartialApplicationCommand,
} from "slash-commands";
import { Size } from "@carto/token-utils";
import { CommandGroup, SubCommand } from "./types.js";

const mapCommand: PartialApplicationCommand = {
  name: CommandGroup.MAP,
  description: "Map commands",
  options: [
    {
      name: SubCommand.MAP_CREATE,
      description: "Create a new map",
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: "url",
          description: "Public URL of the map image",
          required: true,
          type: ApplicationCommandOptionType.STRING,
        },
        {
          name: "rows",
          description: "Number of grid rows",
          required: true,
          type: ApplicationCommandOptionType.INTEGER,
        },
        {
          name: "columns",
          description: "Number of grid columns",
          required: true,
          type: ApplicationCommandOptionType.INTEGER,
        },
      ],
    },
    {
      name: SubCommand.MAP_GET,
      description: "Get the map in its current state",
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: SubCommand.MAP_DELETE,
      description: "Delete all map data associated with this channel",
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

const tokenCommand: PartialApplicationCommand = {
  name: CommandGroup.TOKEN,
  description: "Create or update tokens on an existing map",
  options: [
    {
      name: SubCommand.TOKEN_ADD,
      description: "Add a token to the map",
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: "name",
          description: "Unique name for this token on the map",
          required: true,
          type: ApplicationCommandOptionType.STRING,
        },
        {
          name: "row",
          description: "The starting row for this token",
          required: true,
          type: ApplicationCommandOptionType.INTEGER,
        },
        {
          name: "column",
          description: "The starting column from this token",
          required: true,
          type: ApplicationCommandOptionType.STRING,
        },
        {
          name: "color",
          description: "The token color. Default: Random",
          required: false,
          type: ApplicationCommandOptionType.STRING,
        },
        {
          name: "size",
          description: "Token size",
          type: ApplicationCommandOptionType.INTEGER,
          required: false,
          choices: [
            {
              name: "Tiny",
              value: Size.TINY,
            },
            {
              name: "Small",
              value: Size.SMALL,
            },
            {
              name: "Medium",
              value: Size.MEDIUM,
            },
            {
              name: "Large",
              value: Size.LARGE,
            },
            {
              name: "Huge",
              value: Size.HUGE,
            },
            {
              name: "Gargantuan",
              value: Size.GARGANTUAN,
            },
          ],
        },
      ],
    },
    {
      name: SubCommand.TOKEN_MOVE,
      description: "Move a token on the map",
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: "name",
          description: "Name of the token to move",
          required: true,
          type: ApplicationCommandOptionType.STRING,
        },
        {
          name: "row",
          description: "Row to move the token to",
          required: true,
          type: ApplicationCommandOptionType.INTEGER,
        },
        {
          name: "column",
          description: "Column to move the token to",
          required: true,
          type: ApplicationCommandOptionType.STRING,
        },
      ],
    },
    {
      name: SubCommand.TOKEN_DELETE,
      description: "Remove one or more tokens from the map",
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: "name",
          description: "Name of the token to delete",
          required: false,
          type: ApplicationCommandOptionType.STRING,
        },
        {
          name: "all",
          description: "If true, all tokens will be deleted",
          required: false,
          type: ApplicationCommandOptionType.BOOLEAN,
        },
      ],
    },
  ],
};

const interaction = new DiscordInteractions({
  applicationId: process.env.APPLICATION_ID,
  authToken: process.env.BOT_TOKEN,
  publicKey: process.env.PUBLIC_KEY,
});

interaction
  .createApplicationCommand(mapCommand)
  .then(console.log)
  .catch(console.error);

interaction
  .createApplicationCommand(tokenCommand)
  .then(console.log)
  .catch(console.error);
