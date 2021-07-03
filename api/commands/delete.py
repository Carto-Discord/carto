from discord import Embed
from flask import jsonify

from commands.map import database
import publish


def delete_channel_data(channel_id=None, request_json=None):
    if channel_id is None:
        return jsonify(deleted=False, message='No channel provided'), 404

    if request_json is None:
        return jsonify(deleted=False, message='No discord token provided'), 400

    keys = ['token', 'applicationId']
    token, application_id = [request_json.get(key) for key in keys]

    try:
        database.delete_channel_document(channel_id)
        embed = Embed(title="Channel data deleted",
                      description="All related maps will be erased from Carto within 24 hours")

        return publish.publish(token=token, application_id=application_id, embed=embed)
    except Exception:
        embed = Embed(title="Deletion error",
                      description="Data couldn't be deleted, likely because it never existed")

        return publish.publish(token=token, application_id=application_id, embed=embed)
