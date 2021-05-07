from flask import abort, jsonify, make_response
from commands import create, get, delete, token
from logs import Logger


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
    Logger.setup(request.headers.get('function-execution-id'))

    method = request.method

    allowed_methods = ['GET', 'POST', 'DELETE']
    if method not in allowed_methods:
        abort(make_response(jsonify(message="Method not allowed"), 405))

    if method == 'POST':
        request_json = request.get_json(silent=True)
        if request_json is None:
            abort(make_response(jsonify(message="JSON could not be serialised"), 400))

        Logger.log("Received POST with JSON {}".format(
            request_json), severity='DEBUG')

        if 'action' in request_json and request_json['action'] == 'create':
            return create.create_new_map(request_json)

        if 'action' in request_json and request_json['action'] == 'addToken':
            return token.add_token(request_json)

        if 'action' in request_json and request_json['action'] == 'moveToken':
            return token.move_token(request_json)

    if method == 'GET':
        request_params = request.args.to_dict()
        Logger.log("Received GET with Parameters {}".format(
            request_params), severity='DEBUG')

        return get.get_channel_map(request_params)

    if method == 'DELETE':
        request_json = request.get_json(silent=True)
        if request_json is None:
            abort(make_response(jsonify(message="JSON could not be serialised"), 400))

        Logger.log("Received DELETE with JSON {}".format(
            request_json), severity='DEBUG')

        if 'action' in request_json and request_json['action'] == 'deleteToken':
            return token.delete_token(request_json)

        return delete.delete_channel_data(request_json)
