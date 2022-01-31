# Create Map

Creates a new Map attributed to the channel.

## Design

This Lambda should not be invoked directly, it is designed to be part of a State Machine. Exposing it to the internet may result in abuse of the service.

If the command `map` and subcommand `create` is received, the State Machine will invoke this function. The user must have sent the `url`, `rows` and `columns` options.

The function will create a Map from the `url` provided, downloading the image and applying a grid of the size specified. Whilst rows are labelled with numbers increasing from the bottom-left of the image, columns will be labelled as they are in an Excel spreadsheet, with letters. This makes it easier to refer to a certain grid cell without having to remember which of the row or column specifier comes first.

Unlike most other commands, this one will nearly always succeed given it will overwrite any existing Map associated with a channel, if one even exists. Errors can still occur however, and this would likely be due to a runtime error in creating the map, accessing the image URL, or persisting the data to the database.

Once created, the new data (both Map parameters, and the image) is written to their respective data stores, and an [embed](https://discord.com/developers/docs/resources/channel#embed-object) is returned.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name           | Description                               |
| -------------- | ----------------------------------------- |
| CHANNELS_TABLE | DynamoDB Table Name for the Channel data  |
| MAPS_TABLE     | DynamoDB Table Name for the Maps data     |
| MAPS_BUCKET    | S3 Bucket Name that stores the Map images |

The package can be built by running `npm run build -w @carto/create-map` from the repository root.
