from discord import Embed
from flask import current_app

from commands import constants
from commands.map import database, storage
import publish


def get_channel_map(channel_id, request_params):
    keys = ['token', 'applicationId']
    discord_token, application_id = [request_params.get(key) for key in keys]
    error_title = 'Error retrieving map'

    if channel_id is None:
        embed = Embed(title=error_title, description="Channel ID not found")
        return publish.publish(token=discord_token, application_id=application_id, embed=embed)

    uuid = database.get_current_channel_map(channel_id)
    current_app.logger.info("Getting map for channel UUID: {}".format(uuid))

    if uuid is None:
        embed = Embed(title=error_title, description="This channel has no map associated with it")
        return publish.publish(token=discord_token, application_id=application_id, embed=embed)

    channel_map_data = database.get_map_info(uuid)
    embed = Embed(title="Retrieved Map")

    if 'tokens' in channel_map_data:
        tokens = channel_map_data['tokens']
        for token in tokens:
            embed.add_field(name=token['name'], value=f"{token['column'].upper()}{token['row']}", inline=True)

    image_url = storage.get_public_url(bucket_name=constants.BUCKET, file_name=uuid + '.png')
    embed.set_image(url=image_url)

    return publish.publish(token=discord_token, application_id=application_id, embed=embed)
