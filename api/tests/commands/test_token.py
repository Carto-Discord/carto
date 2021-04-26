import json
import unittest
from unittest.mock import patch

from flask import Flask
from werkzeug.exceptions import HTTPException

from api.commands.token import add_token


class TokenTest(unittest.TestCase):
    app = Flask(__name__)

    @patch('commands.map.database.get_current_channel_map')
    def test_invalid_size(self, mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'VERY_SMALL'
        }

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                add_token(request)
                self.assertEqual(http_error.exception.code, 400)

        mock_get_map.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    def test_invalid_map_id(self, mock_map_info, mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM'
        }

        mock_get_map.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                add_token(request)
                self.assertEqual(http_error.exception.code, 404)

        mock_map_info.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    def test_invalid_map_data(self, mock_apply_grid, mock_map_info, mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'tokens': []
        }

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                add_token(request)
                self.assertEqual(http_error.exception.code, 400)

        mock_apply_grid.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    def test_invalid_rows_cols_provided(self, mock_apply_grid, mock_map_info, mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'rows': 2,
            'columns': 2,
            'tokens': []
        }

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                add_token(request)
                self.assertEqual(http_error.exception.code, 400)

        mock_apply_grid.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    def test_grid_cannot_be_created(self, mock_upload, mock_apply_grid, mock_map_info, mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'rows': 5,
            'columns': 5,
            'tokens': []
        }
        mock_apply_grid.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                add_token(request)
                self.assertEqual(http_error.exception.code, 404)

        mock_upload.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    def test_image_cannot_be_uploaded(self, mock_update, mock_upload, mock_apply_grid, mock_map_info, mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'rows': 5,
            'columns': 5,
            'tokens': []
        }
        mock_apply_grid.return_value = 'map.png'
        mock_upload.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                add_token(request)
                self.assertEqual(http_error.exception.code, 500)

        mock_update.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_successful_creation(self, mock_create, mock_update, mock_upload, mock_apply_grid, mock_map_info,
                                 mock_get_map):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'rows': 5,
            'columns': 5,
            'tokens': []
        }
        mock_apply_grid.return_value = 'map.png'
        mock_upload.return_value = 'gcs-file'

        with self.app.app_context():
            response = add_token(request)

        mock_update.assert_called_once()
        mock_create.assert_called_once()

        self.assertEqual(json.loads(response[0].data)['blob'], 'gcs-file')
        self.assertEqual(json.loads(response[0].data)['bucket'], 'bucket')
        self.assertEqual(response[1], 201)


if __name__ == '__main__':
    unittest.main()
