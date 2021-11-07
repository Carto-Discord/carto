import os

from discord import Embed
from flask import current_app, jsonify
import requests


def publish(token: str, application_id: str, embed: Embed):
    url = f'https://discord.com/api/v9/webhooks/{application_id}/{token}/messages/@original'
    json = {'embeds': [embed.to_dict()]}

    current_app.logger.debug(embed.to_dict())

    if os.getenv('DRY_RUN') is not None:
        return jsonify(url=url, json=json), 200

    requests.patch(url,
                   headers={'Content-Type': 'application/json'},
                   json=json)

    return '', 204
