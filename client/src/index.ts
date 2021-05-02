import Discord from "discord.js";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createMap } from "./create";
import { getMap } from "./get";
import { deleteChannel } from "./delete";
import { addToken, deleteToken, moveToken } from "./token";

dotenv.config();

// Front end routing - BEGIN
const app = express();

app.get("/", (_req, res) => {
  res.set("X-Clacks-Overhead", "GNU Terry Pratchet");
  res.sendFile(path.join(__dirname + "/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// Front end routing - END

// Server Discord client - BEGIN
const client = new Discord.Client();
const prefix = "!";

client.once("ready", () => {
  console.log("Ready!");
});

const getParameters = (content: string) => {
  const spaceIndex = content.indexOf(" ");
  return spaceIndex >= 0 ? content.substr(spaceIndex + 1).split(" ") : [];
};

client.on("message", async (message) => {
  if (message.content.startsWith(`${prefix}create`)) {
    console.log(`Received creation request: ${message.content}`);
    const parameters = getParameters(message.content);

    const [url, rows, columns] = parameters;

    if (!url || !rows || !columns) {
      message.channel.send("Create usage: `!create <url> <rows> <columns>`");
      return;
    }

    if (isNaN(+rows) || isNaN(+columns)) {
      message.channel.send("Rows and Columns must be numbers");
      return;
    }

    const response = await createMap({
      url,
      rows: Number(rows),
      columns: Number(columns),
      channelId: message.channel.id,
    });

    response.success
      ? message.channel.send(`Map created for ${message.author.toString()}`, {
          files: [response.body],
        })
      : message.channel.send(response.body);
  }

  if (message.content.startsWith(`${prefix}token add`)) {
    console.log(`Received token update request: ${message.content}`);
    const parameters = getParameters(message.content);

    const [_, name, row, column, colour, size, condition] = parameters;

    if (!name || !row || !column) {
      message.channel.send(
        "Add token usage: `!token add <name> <row> <column> <colour> <size>`"
      );
      return;
    }

    if (isNaN(+row)) {
      message.channel.send("Row must be a number");
      return;
    }

    const response = await addToken({
      name,
      row: Number(row),
      column,
      size: size?.toUpperCase(),
      condition,
      colour,
      channelId: message.channel.id,
    });

    response.success
      ? message.channel.send(
          `Token ${name} added by ${message.author.toString()}`,
          {
            files: [response.body],
          }
        )
      : message.channel.send(response.body);
  }

  if (message.content.startsWith(`${prefix}token move`)) {
    console.log(`Received token move request: ${message.content}`);
    const parameters = getParameters(message.content);

    const [_, name, row, column] = parameters;

    if (!name || !row || !column) {
      message.channel.send(
        "Move token usage: `!token move <name> <row> <column>`"
      );
      return;
    }

    if (isNaN(+row)) {
      message.channel.send("Row must be a number");
      return;
    }

    const response = await moveToken({
      name,
      row: Number(row),
      column,
      channelId: message.channel.id,
    });

    response.success
      ? message.channel.send(
          `Token ${name} moved by ${message.author.toString()}`,
          {
            files: [response.body],
          }
        )
      : message.channel.send(response.body);
  }

  if (message.content.startsWith(`${prefix}token delete`)) {
    console.log(`Received token deletion request: ${message.content}`);
    const parameters = getParameters(message.content);

    const [_, name] = parameters;

    if (!name) {
      message.channel.send("Delete token usage: `!token delete <name>`");
      return;
    }

    const response = await deleteToken({
      name,
      channelId: message.channel.id,
    });

    response.success
      ? message.channel.send(
          `Token ${name} deleted by ${message.author.toString()}`,
          {
            files: [response.body],
          }
        )
      : message.channel.send(response.body);
  }

  if (message.content.startsWith(`${prefix}map`)) {
    console.log(`Received Map get request: ${message.content}`);

    const response = await getMap({
      channelId: message.channel.id,
    });

    response.success
      ? message.channel
          .send("Map retrieved", {
            files: [response.body],
          })
          .then((message) => {
            response.message && message.channel.send(response.message);
          })
      : message.channel.send(response.body);
  }

  if (message.content.startsWith(`${prefix}help`)) {
    const channel = await message.author.createDM();

    const helpMessage =
      "How to use Carto - Default values are in brackets:\n" +
      "Create a new map\n`!create <public url> <rows> <columns>`\n" +
      "Add a new token to the map\n`!token add <name> <row> <column> <colour (random)> <size (Medium)>`\n" +
      "Show the current channel's map\n`!map`\n" +
      "**Important Info**\nMap states will be deleted after 30 days. Changing the map in any way will extend this period.\n" +
      "Deleting a channel will delete all associated maps. The deleter will recieve the final map state as DM.";
    await channel.send(helpMessage);

    message.channel.send("Help instructions have been sent to your DMs");
  }
});

client.on("channelDelete", async (channel) => {
  await deleteChannel({ channelId: channel.id });
});

client.login(process.env.BOT_TOKEN);
// Server Discord client - END
