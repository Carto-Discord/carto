from unittest import TestCase
from unittest.mock import Mock, patch

from flask import Flask
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

    @patch('commands.create.create_new_map')
    def test_invalid_action(self, mock_create):
        params = {
            'action': 'blah',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'channelId': '1234'
        }

        request = Mock(method='POST', get_json=Mock(return_value=params))
        with self.app.app_context():
            function(request)
            mock_create.assert_not_called()

    @patch('commands.create.create_new_map')
    def test_action_create(self, mock_create):
        params = {
            'action': 'create',
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'channelId': '1234'
        }

        request = Mock(method='POST', get_json=Mock(return_value=params))
        with self.app.app_context():
            function(request)
            mock_create.assert_called_with(params)

    @patch('commands.get.get_channel_map')
    def test_get_map(self, mock_get):
        params = {'channelId': '1234'}

        request = Mock(method='GET', args=Mock(to_dict=Mock(return_value=params)))
        with self.app.app_context():
            function(request)
            mock_get.assert_called_with(params)
