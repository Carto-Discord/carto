from flask import abort, jsonify, make_response
from commands import constants
from commands.map import database
from logs import Logger


def get_channel_map(request_params):
    channel_id = request_params.get('channelId', None)
    if channel_id is None:
        abort(make_response(jsonify(message="No channel found"), 400))

    uuid = database.get_current_channel_map(channel_id)
    Logger.log("Getting map for channel UUID: {}".format(uuid), severity='DEBUG')

    if uuid is None:
        abort(make_response(jsonify(message="This channel has no current map associated"), 404))

    channel_map_data = database.get_map_info(uuid)
    message = ''

    if 'tokens' in channel_map_data:
        tokens = channel_map_data['tokens']
        message = 'Tokens on map:\n'
        for token in tokens:
            message += f"{token['name']}: ({token['column']}, {token['row']})\n"

    return (jsonify(blob="{}.png".format(uuid), bucket=constants.BUCKET, message=message),
            200,
            {'Content-Type': 'application/json'})
