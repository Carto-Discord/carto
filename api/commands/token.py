from datetime import datetime
import ntpath
import uuid

from flask import abort, jsonify, make_response
from numpy import random

from commands.map import database, grid, storage
from commands.map.Token import size, Token
from commands import constants


def validate_map_data(channel_id):
    channel_map_id = database.get_current_channel_map(channel_id)

    if channel_map_id is None:
        message = "No map exists for this channel. Create one with the !create command"
        abort(make_response(jsonify(message=message), 404))

    channel_map_data = database.get_map_info(channel_map_id)

    if 'rows' not in channel_map_data or 'columns' not in channel_map_data:
        message = "Map data for this channel is incomplete. Please report this as an issue on GitHub"
        abort(make_response(jsonify(message=message), 404))

    return channel_map_data


def validate_token_position(token_row, token_column, grid_rows, grid_columns):
    if int(token_row) > grid_rows or grid.column_number(token_column) > grid_columns:
        message = "The row or column you entered is not on the map, please try again. " \
                  "This map's bounds are {} rows by {} columns".format(grid_rows, grid_columns)
        abort(make_response(jsonify(message=message), 400))


def convert_to_tokens(tokens_array):
    tokens = []
    for t in tokens_array:
        token = Token(name=t['name'], row=t['row'], column=t['column'], size=t['size'], colour=t['colour'])
        tokens.append(token)

    return tokens


def create_new_grid(url, rows, columns, tokens, channel_id):
    source_file_name = grid.apply_grid(image_url=url, rows=rows, cols=columns, tokens=tokens)

    if source_file_name is None:
        message = "Url {} could not be found".format(url)
        abort(make_response(jsonify(message=message), 404))

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])

    if file is None:
        message = "Map could not be created"
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


def add_token(request_json):
    keys = ['channelId', 'name', 'row', 'column', 'size', 'colour']
    channel_id, name, row, column, token_size, colour = [request_json.get(key) for key in keys]

    if str.upper(token_size) not in size.keys():
        message = "Size {} is invalid. Valid sizes are as in the D&D Basic Rules".format(token_size)
        abort(make_response(jsonify(message=message), 400))

    channel_map_data = validate_map_data(channel_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    validate_token_position(row, column, rows, columns)

    if colour is None:
        r = lambda: random.randint(0, 255)
        colour = '#%02X%02X%02X' % (r(), r(), r())

    tokens = convert_to_tokens(tokens)

    new_token = Token(name=name, row=int(row), column=column, size=size[token_size], colour=colour)
    tokens.append(new_token)

    return create_new_grid(url, rows, columns, tokens, channel_id)


def move_token(request_json):
    keys = ['channelId', 'name', 'row', 'column']
    channel_id, name, row, column = [request_json.get(key) for key in keys]

    channel_map_data = validate_map_data(channel_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    validate_token_position(row, column, rows, columns)

    tokens = convert_to_tokens(tokens)

    if name not in [t.name for t in tokens]:
        message = "Token {} not found in map. Token names are case sensitive, so try again or add it using !token add"
        abort(make_response(jsonify(message=message), 404))

    for i, token in enumerate(tokens):
        if token.name == name:
            token.row = int(row)
            token.column = column
            break

    return create_new_grid(url, rows, columns, tokens, channel_id)
