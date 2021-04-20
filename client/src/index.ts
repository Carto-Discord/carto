import Discord from "discord.js";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createMap } from "./create";
import { getMap } from "./get";

dotenv.config();

// Front end routing - BEGIN
const app = express();

app.get("/", (_req, res) => {
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
  return spaceIndex >= 0
    ? content.substr(spaceIndex + 1).split(" ")
    : undefined;
};

client.on("message", async (message) => {
  if (message.content.startsWith(`${prefix}create`)) {
    console.log(`Received creation request: ${message.content}`);
    const parameters = getParameters(message.content);

    if (parameters?.length === 3) {
      const [url, rows, columns] = parameters;
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
    } else {
      message.channel.send("Create usage: !create <url> <rows> <columns>");
    }
  }

  if (message.content.startsWith(`${prefix}map`)) {
    console.log(`Received Map get request: ${message.content}`);

    const response = await getMap({
      channelId: message.channel.id,
    });

    response.success
      ? message.channel.send("Map retrieved", {
          files: [response.body],
        })
      : message.channel.send(response.body);
  }

  if (message.content.startsWith(`${prefix}ping`)) message.channel.send("pong");
});

client.login(process.env.BOT_TOKEN);
// Server Discord client - END
