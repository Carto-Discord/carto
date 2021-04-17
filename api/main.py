from datetime import datetime
import uuid

from flask import abort, jsonify
from map import grid, storage

cloud_storage_bucket = 'carto-map-uploads'


def function(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
        <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
        <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
    """
    method = request.method
    allowed_methods = ['GET', 'POST', 'DELETE']
    if method not in allowed_methods:
        abort(405)

    request_json = request.get_json(silent=True)
    if request_json is None:
        abort(400, "JSON could not be serialised")

    if method == 'POST':
        if 'action' in request_json and request_json['action'] == 'create':
            keys = ['url', 'rows', 'columns']
            url, rows, columns = [request_json.get(key) for key in keys]

            source_file_name = grid.apply_grid(url, rows, columns)
            if source_file_name is None:
                abort(404, "Url {} could not be found".format(url))

            path = storage.upload_blob(cloud_storage_bucket,
                                       source_file_name,
                                       str(uuid.uuid4()) + '.' + source_file_name.split('.')[-1])
            if path is None:
                abort(500, "Map could not be created")
            else:
                response = {
                    'created': datetime.now().isoformat(),
                    'downloadUrl': path
                }
                return (jsonify(response),
                        201,
                        {'Content-Type': 'application/json'})
