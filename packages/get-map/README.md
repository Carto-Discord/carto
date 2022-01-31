# Get Map

Returns the current Map attributed to the channel.

## Design

This Lambda should not be invoked directly, it is designed to be part of a State Machine. Exposing it to the internet may result in abuse of the service.

If the command `map` and subcommand `get` is received, the State Machine will invoke this function. The user doesn't need to send any further options.

The function will check for any existing Channel data in the database and return the Map image defined in the `currentMap` field, along with any Tokens that have been placed on the Map as an [embed](https://discord.com/developers/docs/resources/channel#embed-object).

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name           | Description                               |
| -------------- | ----------------------------------------- |
| CHANNELS_TABLE | DynamoDB Table Name for the Channel data  |
| MAPS_TABLE     | DynamoDB Table Name for the Maps data     |
| MAPS_BUCKET    | S3 Bucket Name that stores the Map images |

The package can be built by running `npm run build -w @carto/get-map` from the repository root.
