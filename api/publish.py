import json
import os

from google.cloud import pubsub_v1

PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT')
TOPIC = os.getenv('PUBSUB_TOPIC')


def publish(token, application_id, message=None, image_url=None):
    # Instantiates a Pub/Sub client
    publisher = pubsub_v1.PublisherClient()

    print(f'Publishing message to topic {TOPIC}')

    # References an existing topic
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC)

    message_dict = {
        'token': token,
        'applicationId': application_id,
    }

    if image_url is not None:
        message_dict['imageUrl'] = image_url

    if message is not None:
        message_dict['message'] = message

    message_json = json.dumps(message_dict)
    message_bytes = message_json.encode('utf-8')

    # Publishes a message
    try:
        publish_future = publisher.publish(topic_path, data=message_bytes)
        publish_future.result()  # Verify the publish succeeded
        return 'Message published.'
    except Exception as e:
        print(e)
        return e, 500
