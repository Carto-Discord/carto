from datetime import datetime
import ntpath
import uuid

from flask import abort, jsonify, make_response
from numpy import random

from commands.map import database, grid, storage
from commands.map.Token import size, Token
from commands import constants


def add_token(request_json):
    keys = ['channelId', 'name', 'row', 'column', 'size', 'colour']
    channel_id, name, row, column, token_size, colour = [request_json.get(key) for key in keys]

    if str.upper(token_size) not in size.keys():
        abort(make_response(
            jsonify(message="Size {} is invalid. Valid sizes are as in the D&D Basic Rules".format(token_size)), 400))

    channel_map_id = database.get_current_channel_map(channel_id)

    if channel_map_id is None:
        abort(
            make_response(jsonify(message="No map exists for this channel. Create one with the !create command"), 404))

    channel_map_data = database.get_map_info(channel_map_id)

    if 'rows' not in channel_map_data or 'columns' not in channel_map_data:
        abort(
            make_response(
                jsonify(message="Map data for this channel is incomplete. Please report this as an issue on GitHub"),
                404))

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    if int(row) > rows or grid.column_number(column) > columns:
        abort(make_response(jsonify(
            message="The row or column you entered is not on the map, please try again. "
                    "This map's bounds are {} rows by {} columns".format(rows, columns)), 400))

    if colour is None:
        colour = tuple(random.choice(range(256), size=3))

    new_token = Token(name=name, row=int(row), column=column, size=size[token_size], colour=colour)
    tokens.append(new_token.to_dict())

    source_file_name = grid.apply_grid(url, rows, columns, tokens)

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
        database.create_map_info(uuid=map_uuid, url=url, rows=rows, columns=columns, tokens=tokens)
        response = {
            'created': datetime.now().isoformat(),
            'blob': file,
            'bucket': constants.BUCKET
        }
        return (jsonify(response),
                201,
                {'Content-Type': 'application/json'})
