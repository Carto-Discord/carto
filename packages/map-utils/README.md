# Map Utilities

A collection of utilities to aid in creating and editing Maps

### `getColumnString`

Converts a column number into a string representation

```ts
getColumnString(1) === "A";
getColumnString(702) === "ZZ";
```

### `getColumnNumber`

Converts a column string into a numerical representation

```ts
getColumnNumber("A") === 1;
getColumnNumber("ZZ") === 702;
```

### `updateChannelBaseMap`

Takes a Channel ID and replaces the `baseMap` with the `mapId` provided. It can also wipe the `history` if `isBase` is enabled.

### `findOptimalFontSize`

Overwrites the canvas context font size with the largest possible font that fits the `text` within the `maxWidth` and `maxHeight` boundaries.

### `setupLibraries`

Sets environment variables that allow the Lambda to load custom libraries injected to make `node-canvas` work.
