# Token Utilities

A collection of utilities to aid in creating and editing Tokens

### `downloadImage`

Downloads an image from AWS S3 with a given `filename`, to the `filepath`.

### `placeTinyToken`

Returns the bounding coordinates of the image where a `TINY` sized token should be placed.

### `applyTokensToGrid`

Takes a downloaded image and an array of tokens, and applies those tokens to the map. `margin` is also required to apply the correct offset from the axes at the edges of the Map.

### `uploadMap`

Uploads an image buffer to a channel with a specified `mapId` and `tokens`. Requires the following environment variables to be set;

| Name        | Description                               |
| ----------- | ----------------------------------------- |
| MAPS_TABLE  | DynamoDB Table Name for the Maps data     |
| MAPS_BUCKET | S3 Bucket Name that stores the Map images |

### `validateMapData`

Checks whether the map data for a specific `channelId` is valid. This means it has a `baseMap` and `currentMap` that are found in the Maps database.

### `validateTokenPosition`

Given a single `token` and `grid` specification, this will check if the token can fit inside the grid and return this as a boolean value.
