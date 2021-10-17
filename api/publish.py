import os

from discord import Embed
from flask import current_app
import requests


def publish(token: str, application_id: str, embed: Embed):
    current_app.logger.debug(embed.to_dict())
    is_test = os.getenv('DRY_RUN') == 'true'

    # Dry runs should not call the Discord API
    if is_test: return '', 204

    requests.patch(f'https://discord.com/api/v9/webhooks/{application_id}/{token}/messages/@original',
                   headers={'Content-Type': 'application/json'},
                   json={'embeds': [embed.to_dict()]})

    return '', 204
