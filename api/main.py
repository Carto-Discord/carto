from flask import abort, jsonify, make_response
from commands import create, get

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

    if method == 'POST':
        request_json = request.get_json(silent=True)
        if request_json is None:
            abort(make_response(jsonify(message="JSON could not be serialised"), 400))

        if 'action' in request_json and request_json['action'] == 'create':
            return create.create_new_map(request_json)

    if method == 'GET':
        request_params = request.args.to_dict()
        return get.get_channel_map(request_params)
