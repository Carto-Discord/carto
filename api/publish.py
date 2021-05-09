import os

import google.auth.transport.requests
import google.oauth2.id_token
import requests


def publish(token, application_id, message=None, image_url=None):
    service_url = os.getenv('HTTP_TRIGGER_URL')

    auth_req = google.auth.transport.requests.Request()
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, service_url)

    message_dict = {
        'token': token,
        'applicationId': application_id,
    }

    if image_url is not None:
        message_dict['imageUrl'] = image_url

    if message is not None:
        message_dict['message'] = message

    requests.post(service_url, json=message_dict, headers={'Authorization': f"Bearer {id_token}"})

    return '', 200
