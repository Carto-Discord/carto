# Delete Map

Deletes the Map/s attributed to the channel.

## Design

This Lambda should not be invoked directly, it is designed to be part of a State Machine. Exposing it to the internet may result in abuse of the service.

If the command `map` and subcommand `delete` is received, the State Machine will invoke this function. The user doesn't need to send any further options.

The function will check for any existing Channel data in the database and delete it. This will not _immediately_ delete the Map data, nor the images, but it will implicitly queue them up for deletion by the next time the [`janitor`](../janitor) runs.

Once the appropriate data has been deleted an [embed](https://discord.com/developers/docs/resources/channel#embed-object) is returned.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name           | Description                              |
| -------------- | ---------------------------------------- |
| CHANNELS_TABLE | DynamoDB Table Name for the Channel data |

The package can be built by running `npm run build -w @carto/delete-map` from the repository root.
