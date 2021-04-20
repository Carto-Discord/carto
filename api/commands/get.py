from flask import abort, jsonify, make_response
from api.commands import constants
from api.map import database


def get_channel_map(request_params):
    channel_id = request_params.get('channelId', None)
    if channel_id is None:
        abort(make_response(jsonify(message="No channel found"), 400))

    uuid = database.get_current_channel_map(channel_id)

    if uuid is None:
        abort(make_response(jsonify(message="This channel has no current map associated"), 404))
    else:
        return (jsonify(blob="{}.png".format(uuid), bucket=constants.BUCKET),
                200,
                {'Content-Type': 'application/json'})
