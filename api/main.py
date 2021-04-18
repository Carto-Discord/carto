from datetime import datetime
import ntpath
import uuid

from flask import abort, jsonify, make_response
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
        abort(make_response(jsonify(message="Method not allowed"), 405))

    request_json = request.get_json(silent=True)
    if request_json is None:
        abort(make_response(jsonify(message="JSON could not be serialised"), 400))

    if method == 'POST':
        if 'action' in request_json and request_json['action'] == 'create':
            keys = ['url', 'rows', 'columns']
            url, rows, columns = [request_json.get(key) for key in keys]

            source_file_name = grid.apply_grid(url, rows, columns)
            if source_file_name is None:
                abort(make_response(jsonify(message="Url {} could not be found".format(url)), 404))

            file_name = ntpath.basename(source_file_name)
            file = storage.upload_blob(cloud_storage_bucket,
                                       file_name,
                                       str(uuid.uuid4()) + '.' + file_name.split('.')[-1])
            if file is None:
                abort(make_response(jsonify(message="Map could not be created"), 500))
            else:
                response = {
                    'created': datetime.now().isoformat(),
                    'fileName': file
                }
                return (jsonify(response),
                        201,
                        {'Content-Type': 'application/json'})
