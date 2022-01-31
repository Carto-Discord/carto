---
layout: default
title: Troubleshooting
nav_order: 4
has_children: false
---

# Troubleshooting

Here is a list of possible error messages and how they can be resolved. Many errors contain remediation instructions in their message, so will not be covered here.

## Common errors

### "Map data for this channel is incomplete"

This can occur in many scenarios, mainly due to an internal error that has caused the bot to not save all vital information, namely the Base Map, the Current Map, and the history. It could also refer to a Map not having all _its_ information, such as Tokens or numbers of Rows and Columns.

Whilst automated rebuilding of maps may come in a future update, there is no solution other than creating a new Map with [the `create` command](../commands/map#create). If the problem persists, notify the development team on the Discord server, or raise [an issue](https://www.github.com/carto-discord/carto/issues).

## Map errors

These are errors that could arise from `/map` commands.

### "URL \_\_\_ could not be found".

All URLs passed to `/map create` must be direct links to files; Google Drive, Dropbox, or other sharing services will not work unless they directly link to a file with public, unrestricted access. If, for any reason, the bot cannot find an image file at the location provided, this error will be thrown.

### "Map data could not be saved due to an internal error"

This can occur when the Map image fails to save, or the database cannot be updated with the new data.

As this is usually a service issue outside of our control, the best course of action is to try again later (a few minutes should do). If the problem persists, notify the development team on the Discord server, or raise [an issue](https://www.github.com/carto-discord/carto/issues).

## Token errors

These are errors that could arise from `/token` commands.

### "Map could not be recreated. Reason: Original map could not be found"

When adding a Token, the bot will use the Base Map, a cached version of the last Map created with `/map create`. In some circumstances, this cached image may not be available due to temporary downtime outside of our control.

The easiest way to remediate this is to try again later (a few minutes should do). If the problem persists, notify the development team on the Discord server, or raise [an issue](https://www.github.com/carto-discord/carto/issues).

### "Map could not be created"

This error indicates the actual process of drawing your Map failed, likely due to an internal error such as memory limits being reached.

The easiest way to remediate this is to try again later (a few minutes should do). Alternatively, recreate the Map with a lower quality image, as this will put less strain on the servers. If the problem persists, notify the development team on the Discord server, or raise [an issue](https://www.github.com/carto-discord/carto/issues).

### "An error occured while uploading the new map"

In these circumstances, a network or service error outside our control has caused the upload of your newly created Map to fail.

The easiest way to remediate this is to try again later (a few minutes should do). If the problem persists, notify the development team on the Discord server, or raise [an issue](https://www.github.com/carto-discord/carto/issues).
