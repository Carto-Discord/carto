# Janitor

Tidies up Map storage and databases by checking for deleted Channels or "orphaned" Maps (i.e. those without a reference by any other data source)

## Design

This Lambda can be invoked directly, but it is preferable to have it run on a schedule depending on how often data might go stale.

There are two stages to a Janitor run;

1. Checking for deleted Channels. If a Discord channel is deleted, we have no need for the associated data anymore. Hence, any Channels with the same ID as the deleted channels will be removed, thus orphaning any Maps in that data.
2. Checking for orphaned Maps. All Maps specified in the Channel data is compared against all the Maps found in the database. If any Map is not present in the first list, it will have all related data deleted.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name           | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| CHANNELS_TABLE | DynamoDB Table Name for the Channel data                          |
| DISCORD_TOKEN  | The Bot token provided by Discord for the Application you created |
| MAPS_TABLE     | DynamoDB Table Name for the Maps data                             |
| MAPS_BUCKET    | S3 Bucket Name that stores the Map images                         |

The package can be built by running `npm run build -w @carto/janitor` from the repository root.
