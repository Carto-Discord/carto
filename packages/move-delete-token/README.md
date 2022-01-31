# Move and Delete Token

Moves or deletes a token on the current Map attributed to the channel.

## Design

This Lambda should not be invoked directly, it is designed to be part of a State Machine. Exposing it to the internet may result in abuse of the service.

If the command `token` and subcommand `move` or `delete` is received, the State Machine will invoke this function. If the `move` subcommand is received, the user must have sent the `name`, `row` number and `column` letter that corresponds with the space that Token should be moved to. If the `delete` subcommand is received, the user must have sent _either_ a `name` or set the `all` flag to true.

As the execution of both commands is generally the same, these two functions have been merged into one. If the functionality diverges in future updates, these functions will be split apart.

In the case of `move`, the Token specified by the `name` is searched for and, if found, moved to the `row` and `column`. The Map is then redrawn and sent back as an [embed](https://discord.com/developers/docs/resources/channel#embed-object).
In the case of `delete`, the Token specified by the `name` is searched for and, if found, removed from the list of Tokens. If `all` is set to `true`, then all Tokens will be deleted from the list. The Map is then redrawn and sent back as an embed, or the `baseMap` is returned if all tokens would have been deleted anyway.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name           | Description                               |
| -------------- | ----------------------------------------- |
| CHANNELS_TABLE | DynamoDB Table Name for the Channel data  |
| MAPS_TABLE     | DynamoDB Table Name for the Maps data     |
| MAPS_BUCKET    | S3 Bucket Name that stores the Map images |

The package can be built by running `npm run build -w @carto/move-delete-token` from the repository root.
