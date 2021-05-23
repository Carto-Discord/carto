import os

from discord import Embed
import google.auth.transport.requests
import google.oauth2.id_token
import requests


def publish(token: str, application_id: str, embed: Embed):
    service_url = os.getenv('HTTP_TRIGGER_URL')

    auth_req = google.auth.transport.requests.Request()
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, service_url)

    message_dict = {
        'token': token,
        'applicationId': application_id,
        'embed': embed.to_dict()
    }

    requests.put(service_url, json=message_dict, headers={'Authorization': f"Bearer {id_token}"})

    return '', 204
