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
        message = "Size {} is invalid. Valid sizes are as in the D&D Basic Rules".format(token_size)
        print(message)
        abort(make_response(jsonify(message=message), 400))

    channel_map_id = database.get_current_channel_map(channel_id)

    if channel_map_id is None:
        message = "No map exists for this channel. Create one with the !create command"
        print(message)
        abort(make_response(jsonify(message=message), 404))

    channel_map_data = database.get_map_info(channel_map_id)

    if 'rows' not in channel_map_data or 'columns' not in channel_map_data:
        message = "Map data for this channel is incomplete. Please report this as an issue on GitHub"
        print(message)
        abort(make_response(jsonify(message=message), 404))

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    if int(row) > rows or grid.column_number(column) > columns:
        message = "The row or column you entered is not on the map, please try again. " \
                  "This map's bounds are {} rows by {} columns".format(rows, columns)
        print(message)
        abort(make_response(jsonify(message=message), 400))

    if colour is None:
        r = lambda: random.randint(0, 255)
        colour = '#%02X%02X%02X' % (r(), r(), r())

    new_token = Token(name=name, row=int(row), column=column, size=size[token_size], colour=colour)
    tokens.append(new_token)

    print("Tokens")
    for t in tokens:
        print(t.to_dict())

    source_file_name = grid.apply_grid(url, rows, columns, tokens)

    if source_file_name is None:
        message = "Url {} could not be found".format(url)
        print(message)
        abort(make_response(jsonify(message=message), 404))

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])

    if file is None:
        message = "Map could not be created"
        print(message)
        abort(make_response(jsonify(message=message), 500))
    else:
        database.update_channel_map(channel_id, map_uuid)
        database.create_map_info(uuid=map_uuid, url=url, rows=rows, columns=columns,
                                 tokens=[t.to_dict() for t in tokens])
        response = {
            'created': datetime.now().isoformat(),
            'blob': file,
            'bucket': constants.BUCKET
        }
        return (jsonify(response),
                201,
                {'Content-Type': 'application/json'})
