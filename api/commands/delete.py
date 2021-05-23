from flask import jsonify

from commands.map import database


def delete_channel_data(channel_id=None):
    if channel_id is None:
        return jsonify(deleted=False, channel='No channel provided'), 404

    database.delete_channel_document(channel_id)

    return jsonify(deleted=True, channel=channel_id), 200
