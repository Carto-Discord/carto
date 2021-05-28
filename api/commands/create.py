import ntpath
import uuid

from discord import Embed
from commands.map import database, grid, storage
from commands import constants
import publish


def create_new_map(channel_id, request_json):
    keys = ['url', 'rows', 'columns', 'token', 'applicationId']
    url, rows, columns, token, application_id = [request_json.get(key) for key in keys]

    error_title = 'Map create error'

    source_file_name, margin_x, margin_y = grid.create_grid(url, rows, columns)
    if source_file_name is None:
        embed = Embed(title=error_title,
                      description="URL {} could not be found.\n"
                                  "Make sure it is public and includes the file extension".format(url))
        return publish.publish(token=token, application_id=application_id, embed=embed)

    map_uuid = str(uuid.uuid4())
    file_name = ntpath.basename(source_file_name)
    file = storage.upload_blob(constants.BUCKET,
                               source_file_name,
                               map_uuid + '.' + file_name.split('.')[-1])
    if file is None:
        embed = Embed(title=error_title,
                      description="Map could not be created due to an internal error.\n"
                                  "Try again later, or [report it](https://www.github.com/carto-discord/carto/issues).")
        return publish.publish(token=token, application_id=application_id, embed=embed)
    else:
        database.update_channel_map(channel_id, map_uuid, is_base=True)
        database.create_map_info(uuid=map_uuid,
                                 data={
                                     'url': url,
                                     'rows': rows,
                                     'columns': columns,
                                     'margin_x': margin_x,
                                     'margin_y': margin_y
                                 })

        embed = Embed(title="Map created") \
            .add_field(name='Rows', value=rows, inline=True) \
            .add_field(name='Columns', value=columns, inline=True) \
            .set_image(url=file)
        return publish.publish(token=token, application_id=application_id, embed=embed)
