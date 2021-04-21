from flask import abort, jsonify, make_response
from commands.map import database


def delete_channel_data(request_json):
    channel_id = request_json.get('channelId', None)
    if channel_id is None:
        abort(make_response(jsonify(message="No channelId provided"), 400))

    database.delete_channel_document(channel_id)

    return '', 204
