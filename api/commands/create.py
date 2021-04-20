from datetime import datetime
import ntpath
import uuid

from flask import abort, jsonify, make_response
from api.map import grid, storage, database
from api.commands import constants


def create_new_map(request_json):
    keys = ['url', 'rows', 'columns', 'channelId']
    url, rows, columns, channel_id = [request_json.get(key) for key in keys]

    source_file_name = grid.apply_grid(url, rows, columns)
    if source_file_name is None:
        abort(make_response(jsonify(message="Url {} could not be found".format(url)), 404))

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])
    if file is None:
        abort(make_response(jsonify(message="Map could not be created"), 500))
    else:
        database.update_channel_map(channel_id, map_uuid)
        database.create_map_info(uuid=map_uuid, url=url, rows=rows, columns=columns)
        response = {
            'created': datetime.now().isoformat(),
            'fileName': file
        }
        return (jsonify(response),
                201,
                {'Content-Type': 'application/json'})
