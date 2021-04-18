import json
from unittest import TestCase
from unittest.mock import Mock, patch

from flask import Flask
from freezegun import freeze_time
from werkzeug.exceptions import HTTPException

from api.main import function


class MainTest(TestCase):
    app = Flask(__name__)

    def test_unallowed_methods(self):
        request = Mock(method='PUT')
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                function(request)
                self.assertEqual(http_error.exception.code, 405)

    def test_invalid_json(self):
        request = Mock(method='POST', get_json=Mock(return_value=None))
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                function(request)
                self.assertEqual(http_error.exception.code, 400)

    @patch('map.grid.apply_grid')
    def test_create_invalid_url(self, mock_apply_grid):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24
        }
        request = Mock(method='POST', get_json=Mock(return_value=params))
        mock_apply_grid.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                function(request)
                self.assertEqual(http_error.exception.code, 404)

    @patch('map.grid.apply_grid')
    @patch('map.storage.upload_blob')
    def test_create_unable_to_upload(self, mock_upload_blob, mock_apply_grid):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24
        }
        request = Mock(method='POST', get_json=Mock(return_value=params))
        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = None

        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                function(request)
                self.assertEqual(http_error.exception.code, 500)

    @freeze_time("2021-04-16")
    @patch('map.grid.apply_grid')
    @patch('map.storage.upload_blob')
    def test_create_success(self, mock_upload_blob, mock_apply_grid):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24
        }
        request = Mock(method='POST', get_json=Mock(return_value=params))
        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs/path/to/file'

        with self.app.app_context():
            response = function(request)

        self.assertEqual(json.loads(response[0].data)['downloadUrl'], 'gcs/path/to/file')
        self.assertEqual(json.loads(response[0].data)['created'], '2021-04-16T00:00:00')
        self.assertEqual(response[1], 201)
