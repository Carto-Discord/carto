from discord import Embed
from flask import current_app
import requests


def publish(token: str, application_id: str, embed: Embed):
    current_app.logger.debug(f'ApplicationId: {application_id}')
    current_app.logger.debug(f'Token: {token}')

    requests.patch(f'https://discord.com/api/v9/webhooks/{application_id}/{token}/messages/@original',
                   headers={'Content-Type': 'application/json'},
                   data={'embeds': [embed.to_dict()]})

    return '', 204
