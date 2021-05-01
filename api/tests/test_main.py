from unittest import TestCase
from unittest.mock import Mock, patch

from flask import Flask
from werkzeug.exceptions import HTTPException

from api.main import function


@patch('logs.Logger.setup')
@patch('logs.Logger.log')
class MainTest(TestCase):
    app = Flask(__name__)

    def test_unallowed_methods(self, mock_log, mock_setup):
        request = Mock(method='PUT')
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                function(request)
                self.assertEqual(http_error.exception.code, 405)

        mock_setup.assert_called()

    def test_invalid_json(self, mock_log, mock_setup):
        request = Mock(method='POST', get_json=Mock(return_value=None))
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                function(request)
                self.assertEqual(http_error.exception.code, 400)

    @patch('commands.create.create_new_map')
    def test_invalid_action(self, mock_create, mock_log, mock_setup):
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
    def test_action_create(self, mock_create, mock_log, mock_setup):
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

    @patch('commands.token.add_token')
    def test_action_add_token(self, mock_add_token, mock_log, mock_setup):
        params = {
            'action': 'addToken',
            'name': 'token name',
            'row': 42,
            'column': 24,
            'channelId': '1234',
            'size': 'MEDIUM',
            'colour': 'red'
        }

        request = Mock(method='POST', get_json=Mock(return_value=params))
        with self.app.app_context():
            function(request)
            mock_add_token.assert_called_with(params)

    @patch('commands.get.get_channel_map')
    def test_get_map(self, mock_get, mock_log, mock_setup):
        params = {'channelId': '1234'}

        request = Mock(method='GET', args=Mock(to_dict=Mock(return_value=params)))
        with self.app.app_context():
            function(request)
            mock_get.assert_called_with(params)

    @patch('commands.delete.delete_channel_data')
    def test_delete_channel(self, mock_delete, mock_log, mock_setup):
        params = {'channelId': '1234'}

        request = Mock(method='DELETE', get_json=Mock(return_value=params))
        with self.app.app_context():
            function(request)
            mock_delete.assert_called_with(params)
