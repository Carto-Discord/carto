import {
  ApplicationCommandOptionType,
  DiscordInteractions,
  PartialApplicationCommand,
} from "slash-commands";
import { CommandGroup, SubCommand } from "./types";

const command: PartialApplicationCommand = {
  name: "carto",
  description: "Create and update maps within this channel",
  options: [
    {
      name: CommandGroup.MAP,
      description: "Map commands",
      type: ApplicationCommandOptionType.SUB_COMMAND_GROUP,
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
      ],
    },
    {
      name: CommandGroup.TOKEN,
      description: "Create or update tokens on an existing map",
      type: ApplicationCommandOptionType.SUB_COMMAND_GROUP,
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
              name: "colour",
              description: "The token colour. Default: Random",
              required: false,
              type: ApplicationCommandOptionType.STRING,
            },
            {
              name: "size",
              description: "Token size",
              type: ApplicationCommandOptionType.STRING,
              required: false,
              choices: [
                {
                  name: "Tiny",
                  value: "TINY",
                },
                {
                  name: "Small",
                  value: "SMALL",
                },
                {
                  name: "Medium",
                  value: "MEDIUM",
                },
                {
                  name: "Large",
                  value: "LARGE",
                },
                {
                  name: "Huge",
                  value: "HUGE",
                },
                {
                  name: "Gargantuan",
                  value: "GARGANTUAN",
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
          description: "Remove a token from the map",
          type: ApplicationCommandOptionType.SUB_COMMAND,
          options: [
            {
              name: "name",
              description: "Name of the token to delete",
              required: true,
              type: ApplicationCommandOptionType.STRING,
            },
          ],
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
  .createApplicationCommand(command)
  .then(console.log)
  .catch(console.error);
