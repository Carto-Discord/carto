import json

from unittest import TestCase
from unittest.mock import patch

from api.main import app


@patch('logs.Logger.setup')
@patch('logs.Logger.log')
class MainTest(TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        self.app = app.test_client()

    def test_invalid_json(self, mock_log, mock_setup):
        self.assertEqual(self.app.post('/map/1234').status, '400 BAD REQUEST')
        self.assertEqual(self.app.delete('/map/1234').status, '400 BAD REQUEST')
        self.assertEqual(self.app.post('/token/1234').status, '400 BAD REQUEST')
        self.assertEqual(self.app.put('/token/1234').status, '400 BAD REQUEST')
        self.assertEqual(self.app.delete('/token/1234').status, '400 BAD REQUEST')

    @patch('commands.create.create_new_map')
    def test_action_create(self, mock_create, mock_log, mock_setup):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
        }
        mock_create.return_value = 'Complete', 200

        self.app.post('/map/1234', data=json.dumps(params), content_type='application/json')
        mock_create.assert_called_with(channel_id='1234', request_json=params)

    @patch('commands.token.add_token')
    def test_action_add_token(self, mock_add_token, mock_log, mock_setup):
        params = {
            'name': 'token name',
            'row': 42,
            'column': 24,
            'size': 'MEDIUM',
            'colour': 'red'
        }
        mock_add_token.return_value = 'Complete', 200

        self.app.post('/token/1234', data=json.dumps(params), content_type='application/json')
        mock_add_token.assert_called_with(channel_id='1234', request_json=params)

    @patch('commands.token.move_token')
    def test_action_move_token(self, mock_move_token, mock_log, mock_setup):
        params = {
            'name': 'token name',
            'row': 42,
            'column': 24,
        }
        mock_move_token.return_value = 'Complete', 200

        self.app.put('/token/1234', data=json.dumps(params), content_type='application/json')
        mock_move_token.assert_called_with(channel_id='1234', request_json=params)

    @patch('commands.get.get_channel_map')
    def test_get_map(self, mock_get, mock_log, mock_setup):
        params = {'channelId': '1234'}
        mock_get.return_value = 'Complete', 200

        self.app.get('/map/1234', query_string=params)
        mock_get.assert_called_with(channel_id='1234', request_params=params)

    @patch('commands.token.delete_token')
    def test_action_delete_token(self, mock_delete_token, mock_log, mock_setup):
        params = {
            'name': 'token name',
        }
        mock_delete_token.return_value = 'Complete', 200

        self.app.delete('/token/1234', data=json.dumps(params), content_type='application/json')
        mock_delete_token.assert_called_with(channel_id='1234', request_json=params)

    @patch('commands.delete.delete_channel_data')
    def test_delete_channel(self, mock_delete, mock_log, mock_setup):
        params = {'token': '1234'}
        mock_delete.return_value = 'Complete', 200

        self.app.delete('/map/1234', data=json.dumps(params), content_type='application/json')
        mock_delete.assert_called_with(channel_id='1234', request_json=params)
