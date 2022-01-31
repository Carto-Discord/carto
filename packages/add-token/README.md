# Add Token

Adds a Token to the current Map attributed to the channel.

## Design

This Lambda should not be invoked directly, it is designed to be part of a State Machine. Exposing it to the internet may result in abuse of the service.

If the command `token` and subcommand `add` is received, the State Machine will invoke this function. The user must have sent the `name`, `row` number and `column` letter that corresponds with the space that Token should be placed. Optionally, a `color` and `size` can be provided, but each of these has a default of a random color or `Medium` size, respectively.

For the execution to succeed, the channel the command is sent from should already have a Map associated with it, specifically a `baseMap`. This base is the image upon which all tokens will be redrawn on top. Assuming the token position is within the bounds of the Map as it was created, the tokens will be redrawn with the parameters both stored in the database, and the one newly applied.

Once created, the new data (both Token parameters, and the Map image) is written to their respective data stores, and an [embed](https://discord.com/developers/docs/resources/channel#embed-object) is returned.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name           | Description                               |
| -------------- | ----------------------------------------- |
| CHANNELS_TABLE | DynamoDB Table Name for the Channel data  |
| MAPS_TABLE     | DynamoDB Table Name for the Maps data     |
| MAPS_BUCKET    | S3 Bucket Name that stores the Map images |

The package can be built by running `npm run build -w @carto/add-token` from the repository root.
