import json
import unittest
from unittest.mock import patch

from flask import Flask
from werkzeug.exceptions import HTTPException

from api.commands.get import get_channel_map


@patch('logs.Logger.log')
class GetTest(unittest.TestCase):
    app = Flask(__name__)

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_get_channel_map(self, mock_map_info, mock_get_map, mock_log):
        mock_get_map.return_value = '1234'
        mock_map_info.return_value = {
            'tokens': [
                {
                    'name': 'token1',
                    'row': 4,
                    'column': 'AA'
                },
                {
                    'name': 'token2',
                    'row': 7,
                    'column': 'B'
                }
            ]
        }

        with self.app.app_context():
            response = get_channel_map({'channelId': '4567'})

        self.assertEqual(json.loads(response[0].data)['blob'], '1234.png')
        self.assertEqual(json.loads(response[0].data)['bucket'], 'bucket')
        self.assertEqual(json.loads(response[0].data)['message'], 'Tokens on map:\ntoken1: (AA, 4)\ntoken2: (B, 7)\n')

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_get_channel_map_no_tokens(self, mock_map_info, mock_get_map, mock_log):
        mock_get_map.return_value = '1234'
        mock_map_info.return_value = {}

        with self.app.app_context():
            response = get_channel_map({'channelId': '4567'})

        self.assertEqual(json.loads(response[0].data)['blob'], '1234.png')
        self.assertEqual(json.loads(response[0].data)['bucket'], 'bucket')
        self.assertEqual(json.loads(response[0].data)['message'], '')

    @patch('commands.map.database.get_current_channel_map')
    def test_get_channel_map_no_uuid(self, mock_get_map, mock_log):
        mock_get_map.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                get_channel_map({'channelId': '4567'})
                self.assertEqual(http_error.exception.code, 404)

    def test_get_channel_map_no_id(self, mock_log):
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                get_channel_map({})
                self.assertEqual(http_error.exception.code, 400)


if __name__ == '__main__':
    unittest.main()
