import json
import unittest
from unittest.mock import patch

from flask import Flask
from werkzeug.exceptions import HTTPException

from api.commands.get import get_channel_map


class GetTest(unittest.TestCase):
    app = Flask(__name__)

    @patch('api.map.database.get_current_channel_map')
    @patch('api.commands.constants.BUCKET', 'bucket')
    def test_get_channel_map(self, mock_get_map):
        mock_get_map.return_value = '1234'

        with self.app.app_context():
            response = get_channel_map({'channelId': '4567'})

        self.assertEqual(json.loads(response[0].data)['blob'], '1234.png')
        self.assertEqual(json.loads(response[0].data)['bucket'], 'bucket')

    @patch('api.map.database.get_current_channel_map')
    def test_get_channel_map_no_uuid(self, mock_get_map):
        mock_get_map.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                get_channel_map({'channelId': '4567'})
                self.assertEqual(http_error.exception.code, 404)

    def test_get_channel_map_no_id(self):
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                get_channel_map({})
                self.assertEqual(http_error.exception.code, 400)


if __name__ == '__main__':
    unittest.main()
