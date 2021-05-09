import ntpath
import uuid

from commands.map import database, grid, storage
from commands import constants
import publish


def create_new_map(request_json):
    keys = ['url', 'rows', 'columns', 'channelId', 'token', 'applicationId']
    url, rows, columns, channel_id, token, application_id = [request_json.get(key) for key in keys]

    source_file_name = grid.apply_grid(url, rows, columns)
    if source_file_name is None:
        return publish.publish(token=token, application_id=application_id,
                               message="Url {} could not be found".format(url))

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])
    if file is None:
        return publish.publish(token=token, application_id=application_id,
                               message="Map could not be created".format(url))
    else:
        database.update_channel_map(channel_id, map_uuid)
        database.create_map_info(uuid=map_uuid, url=url, rows=rows, columns=columns)
        return publish.publish(token=token, application_id=application_id, message="Map created", image_url=file)
