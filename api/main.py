from commands import create, get, delete, token
from logs import Logger
from flask import Flask, request

app = Flask(__name__)


@app.route('/map/<channel_id>')
def get_map(channel_id):
    Logger.setup(request.headers.get('function-execution-id'))
    Logger.log("Received Map get request for Channel {}".format(
        channel_id), severity='DEBUG')

    request_params = request.args.to_dict()
    return get.get_channel_map(channel_id=channel_id, request_params=request_params)


@app.route('/map/<channel_id>', methods=['POST'])
def create_map(channel_id):
    request_json = request.get_json(silent=True)
    if request_json is None:
        return 'JSON could not be serialised', 400

    Logger.setup(request.headers.get('function-execution-id'))
    Logger.log("Received Map create request with JSON {}".format(
        request_json), severity='DEBUG')

    return create.create_new_map(channel_id=channel_id, request_json=request_json)


@app.route('/map/<channel_id>', methods=['DELETE'])
def delete_map(channel_id):
    request_json = request.get_json(silent=True)
    if request_json is None:
        return 'JSON could not be serialised', 400

    Logger.setup(request.headers.get('function-execution-id'))
    Logger.log("Received Map delete request with JSON {}".format(
        request_json), severity='DEBUG')

    return delete.delete_channel_data(channel_id=channel_id, request_json=request_json)


@app.route('/token/<channel_id>', methods=['POST'])
def create_token(channel_id):
    request_json = request.get_json(silent=True)
    if request_json is None:
        return 'JSON could not be serialised', 400

    Logger.setup(request.headers.get('function-execution-id'))
    Logger.log("Received Token create request with JSON {}".format(
        request_json), severity='DEBUG')

    return token.add_token(channel_id=channel_id, request_json=request_json)


@app.route('/token/<channel_id>', methods=['PUT'])
def move_token(channel_id):
    request_json = request.get_json(silent=True)
    if request_json is None:
        return 'JSON could not be serialised', 400

    Logger.setup(request.headers.get('function-execution-id'))
    Logger.log("Received Token move request with JSON {}".format(
        request_json), severity='DEBUG')

    return token.move_token(channel_id=channel_id, request_json=request_json)


@app.route('/token/<channel_id>', methods=['DELETE'])
def delete_token(channel_id):
    request_json = request.get_json(silent=True)
    if request_json is None:
        return 'JSON could not be serialised', 400

    Logger.setup(request.headers.get('function-execution-id'))
    Logger.log("Received Token delete request with JSON {}".format(
        request_json), severity='DEBUG')

    return token.delete_token(channel_id=channel_id, request_json=request_json)
