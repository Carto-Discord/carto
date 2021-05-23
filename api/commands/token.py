import ntpath
import random
import uuid

from discord import Embed
from flask import abort

from commands.map import database, grid, storage
from commands.map.Token import size, Token
from commands import constants
import publish

error_title = 'Token Error'


def validate_map_data(channel_id, discord_token, application_id):
    channel_map_id = database.get_current_channel_map(channel_id)

    if channel_map_id is None:
        message = "No map exists for this channel.\nCreate one with the /map create command"
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(404)

    channel_map_data = database.get_map_info(channel_map_id)

    if 'rows' not in channel_map_data or 'columns' not in channel_map_data:
        message = "Map data for this channel is incomplete. " \
                  "Create the map again or [report it](https://www.github.com/carto-discord/carto/issues)."
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(500)

    return channel_map_data


def validate_token_position(token_row, token_column, grid_rows, grid_columns, discord_token, application_id):
    if int(token_row) > grid_rows or grid.column_number(token_column) > grid_columns:
        message = "The row or column you entered is out of bounds. " \
                  "This map's bounds are {} rows by {} columns".format(grid_rows, grid_columns)
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(400)


def convert_to_tokens(tokens_array):
    tokens = []
    for t in tokens_array:
        token = Token(name=t['name'], row=t['row'], column=t['column'], size=t['size'], colour=t['colour'])
        tokens.append(token)

    return tokens


def create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id):
    source_file_name = grid.apply_grid(image_url=url, rows=rows, cols=columns, tokens=tokens)

    if source_file_name is None:
        message = "Map could not be recreated. Reason: URL {} could not be found".format(url)
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(404)

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])

    if file is None:
        message = "Map could not be created"
        embed = Embed(title=error_title, description=message)
        return publish.publish(token=discord_token, application_id=application_id, embed=embed)
    else:
        database.update_channel_map(channel_id, map_uuid)
        database.create_map_info(uuid=map_uuid, url=url, rows=rows, columns=columns,
                                 tokens=[t.to_dict() for t in tokens])
        embed = Embed(title="Tokens updated", description="Token positions:").set_image(url=file)
        for t in tokens:
            embed.add_field(name=t.name, value=f"{t.column.upper()}{t.row}", inline=True)

        return publish.publish(token=discord_token, application_id=application_id, embed=embed)


def add_token(channel_id, request_json):
    keys = ['name', 'row', 'column', 'size', 'colour', 'token', 'applicationId']
    name, row, column, token_size, colour, discord_token, application_id = [request_json.get(key) for key in
                                                                            keys]

    if str.upper(token_size) not in size.keys():
        message = "Size {} is invalid.\n" \
                  "Valid sizes are as in the " \
                  "[D&D Basic Rules](https://www.dndbeyond.com/sources/basic-rules/monsters#Size)".format(token_size)
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(400)

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


def move_token(channel_id, request_json):
    keys = ['name', 'row', 'column', 'token', 'applicationId']
    name, row, column, discord_token, application_id = [request_json.get(key) for key in keys]

    channel_map_data = validate_map_data(channel_id, discord_token, application_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    validate_token_position(row, column, rows, columns, discord_token, application_id)

    tokens = convert_to_tokens(tokens)

    if name not in [t.name for t in tokens]:
        message = "Token {} not found in map. Token names are case sensitive, " \
                  "so try again or add it using /token add".format(name)
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(404)

    for i, token in enumerate(tokens):
        if token.name == name:
            token.row = int(row)
            token.column = column
            break

    return create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id)


def delete_token(channel_id, request_json):
    keys = ['name', 'token', 'applicationId']
    name, discord_token, application_id = [request_json.get(key) for key in keys]

    channel_map_data = validate_map_data(channel_id, discord_token, application_id)

    keys = ['url', 'rows', 'columns', 'tokens']
    url, rows, columns, tokens = [channel_map_data.get(key) for key in keys]

    tokens = convert_to_tokens(tokens)

    if name not in [t.name for t in tokens]:
        message = "Token {} not found in map. Token names are case sensitive, " \
                  "so try again or add it using /token add".format(name)
        embed = Embed(title=error_title, description=message)
        publish.publish(token=discord_token, application_id=application_id, embed=embed)
        abort(404)

    for i, token in enumerate(tokens):
        if token.name == name:
            tokens.remove(token)
            break

    return create_new_grid(url, rows, columns, tokens, channel_id, discord_token, application_id)
