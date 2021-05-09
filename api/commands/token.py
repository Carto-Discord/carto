import ntpath
import uuid

from numpy import random

from commands.map import database, grid, storage
from commands.map.Token import size, Token
from commands import constants
import publish


def validate_map_data(channel_id, discord_token, application_id):
    channel_map_id = database.get_current_channel_map(channel_id)

    if channel_map_id is None:
        message = "No map exists for this channel. Create one with the /map create command"
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)

    channel_map_data = database.get_map_info(channel_map_id)

    if 'rows' not in channel_map_data or 'columns' not in channel_map_data:
        message = "Map data for this channel is incomplete. Please report this as an issue on GitHub"
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)

    return channel_map_data


def validate_token_position(token_row, token_column, grid_rows, grid_columns, discord_token, application_id):
    if int(token_row) > grid_rows or grid.column_number(token_column) > grid_columns:
        message = "The row or column you entered is not on the map, please try again. " \
                  "This map's bounds are {} rows by {} columns".format(grid_rows, grid_columns)
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)


def convert_to_tokens(tokens_array):
    tokens = []
    for t in tokens_array:
        token = Token(name=t['name'], row=t['row'], column=t['column'], size=t['size'], colour=t['colour'])
        tokens.append(token)

    return tokens


def create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id):
    source_file_name = grid.apply_grid(image_url=url, rows=rows, cols=columns, tokens=tokens)

    if source_file_name is None:
        message = "Url {} could not be found".format(url)
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])

    if file is None:
        message = "Map could not be created"
        return publish.publish(token=discord_token, application_id=application_id, message=message)
    else:
        database.update_channel_map(channel_id, map_uuid)
        database.create_map_info(uuid=map_uuid, url=url, rows=rows, columns=columns,
                                 tokens=[t.to_dict() for t in tokens])
        return publish.publish(token=discord_token, application_id=application_id, image_url=file)


def add_token(request_json):
    keys = ['channelId', 'name', 'row', 'column', 'size', 'colour', 'token', 'applicationId']
    channel_id, name, row, column, token_size, colour, discord_token, application_id = [request_json.get(key) for key in
                                                                                        keys]

    if str.upper(token_size) not in size.keys():
        message = "Size {} is invalid. Valid sizes are as in the D&D Basic Rules".format(token_size)
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)

    channel_map_data = validate_map_data(channel_id, discord_token, application_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    validate_token_position(row, column, rows, columns, discord_token, application_id)

    if colour is None:
        r = lambda: random.randint(0, 255)
        colour = '#%02X%02X%02X' % (r(), r(), r())

    tokens = convert_to_tokens(tokens)

    new_token = Token(name=name, row=int(row), column=column, size=size[token_size], colour=colour)
    tokens.append(new_token)

    return create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id)


def move_token(request_json):
    keys = ['channelId', 'name', 'row', 'column', 'token', 'applicationId']
    channel_id, name, row, column, discord_token, application_id = [request_json.get(key) for key in keys]

    channel_map_data = validate_map_data(channel_id, discord_token, application_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    validate_token_position(row, column, rows, columns, discord_token, application_id)

    tokens = convert_to_tokens(tokens)

    if name not in [t.name for t in tokens]:
        message = "Token {} not found in map. Token names are case sensitive, so try again or add it using /token add".format(
            name)
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)

    for i, token in enumerate(tokens):
        if token.name == name:
            token.row = int(row)
            token.column = column
            break

    return create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id)


def delete_token(request_json):
    keys = ['channelId', 'name', 'token', 'applicationId']
    channel_id, name, discord_token, application_id = [request_json.get(key) for key in keys]

    channel_map_data = validate_map_data(channel_id, discord_token, application_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    tokens = convert_to_tokens(tokens)

    if name not in [t.name for t in tokens]:
        message = "Token {} not found in map. Token names are case sensitive, so try again or add it using /token add".format(
            name)
        publish.publish(token=discord_token, application_id=application_id, message=message)
        exit(0)

    for i, token in enumerate(tokens):
        if token.name == name:
            tokens.remove(token)
            break

    return create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id)
