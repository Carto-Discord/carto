from discord import Embed
import requests


def publish(token: str, application_id: str, embed: Embed):
    requests.patch(f'https://discord.com/api/v9/webhooks/{application_id}/{token}/messages/@original',
                   headers={'Content-Type': 'application/json'},
                   data={'embeds': [embed.to_dict()]})

    return '', 204
