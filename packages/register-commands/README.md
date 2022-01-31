# Register Commands

This package contains the Application Command definitions for the bot and a script to register them to a specific Discord Bot

## Design

The `slash-command` library is used to ensure proper typing of the command registration body, as detailed in the [Discord documentation](https://discord.com/developers/docs/interactions/application-commands#making-a-global-command)

## Run the script

First, the script must be built with `npm run build -w @carto/register-commands` from the project root.
Then, ensure the following environment variables are set;

| Name           | Description                    |
| -------------- | ------------------------------ |
| APPLICATION_ID | Discord Application Id         |
| BOT_TOKEN      | Discord Bot Token              |
| PUBLIC_KEY     | Discrod Application Public Key |

Finally, just run `npm start -w @carto/register-commands`
