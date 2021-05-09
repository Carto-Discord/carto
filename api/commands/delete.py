from commands.map import database
import publish


def delete_channel_data(request_json):
    keys = ['channelId', 'token', 'applicationId']
    channel_id, discord_token, application_id = [request_json.get(key) for key in keys]

    if channel_id is None:
        return publish.publish(token=discord_token, application_id=application_id, message="No channel found")

    database.delete_channel_document(channel_id)

    return publish.publish(token=discord_token, application_id=application_id, message="Channel data deleted")
