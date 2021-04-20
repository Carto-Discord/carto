import json
import unittest
from unittest.mock import patch

from flask import Flask
from freezegun import freeze_time
from werkzeug.exceptions import HTTPException

from api.commands.create import create_new_map


class CreateTest(unittest.TestCase):
    app = Flask(__name__)

    @patch('api.map.grid.apply_grid')
    def test_create_invalid_url(self, mock_apply_grid):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'channelId': '1234'
        }
        mock_apply_grid.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                create_new_map(params)
                self.assertEqual(http_error.exception.code, 404)

    @patch('api.map.grid.apply_grid')
    @patch('api.map.storage.upload_blob')
    def test_create_unable_to_upload(self, mock_upload_blob, mock_apply_grid):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'channelId': '1234'
        }
        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                create_new_map(params)
                self.assertEqual(http_error.exception.code, 500)

    @freeze_time("2021-04-16")
    @patch('api.map.grid.apply_grid')
    @patch('api.map.storage.upload_blob')
    @patch('api.map.database.update_channel_map')
    @patch('api.map.database.create_map_info')
    def test_create_success(self, mock_create_map_info, mock_update_channel_map, mock_upload_blob, mock_apply_grid):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'channelId': '1234'
        }
        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        with self.app.app_context():
            response = create_new_map(params)

        self.assertEqual(json.loads(response[0].data)['fileName'], 'gcs-file')
        self.assertEqual(json.loads(response[0].data)['created'], '2021-04-16T00:00:00')
        self.assertEqual(response[1], 201)
        mock_update_channel_map.assert_called()
        mock_create_map_info.assert_called()


if __name__ == '__main__':
    unittest.main()
