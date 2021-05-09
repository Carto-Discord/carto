from commands import constants
from commands.map import database, storage
from logs import Logger
import publish


def get_channel_map(request_params):
    keys = ['channelId', 'token', 'applicationId']
    channel_id, discord_token, application_id = [request_params.get(key) for key in keys]

    if channel_id is None:
        return publish.publish(token=discord_token, application_id=application_id, message="No channel found")

    uuid = database.get_current_channel_map(channel_id)
    Logger.log("Getting map for channel UUID: {}".format(uuid), severity='DEBUG')

    if uuid is None:
        return publish.publish(token=discord_token, application_id=application_id,
                               message="This channel has no current map associated")

    channel_map_data = database.get_map_info(uuid)
    message = ''

    if 'tokens' in channel_map_data:
        tokens = channel_map_data['tokens']
        message = 'Tokens on map:\n'
        for token in tokens:
            message += f"{token['name']}: ({token['column']}, {token['row']})\n"

    image_url = storage.get_public_url(bucket_name=constants.BUCKET, uuid=uuid)

    return publish.publish(token=discord_token, application_id=application_id, message=message, image_url=image_url)
