import unittest
from unittest.mock import patch

from flask import Flask

from api.commands.get import get_channel_map


class GetTest(unittest.TestCase):
    app = Flask(__name__)

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('publish.publish')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_get_channel_map(self, mock_publish, mock_public_url, mock_map_info, mock_get_map):
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
                    'column': 'b'
                }
            ]
        }
        mock_public_url.return_value = 'public url'

        with self.app.app_context():
            get_channel_map(channel_id='4567', request_params={'token': 'mockToken', 'applicationId': '456'})

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Retrieved Map',
                              'fields': [
                                  {
                                      'name': 'token1',
                                      'value': 'AA4',
                                      'inline': True
                                  },
                                  {
                                      'name': 'token2',
                                      'value': 'B7',
                                      'inline': True
                                  }
                              ],
                              'image': {
                                  'url': 'public url'
                              }},
                             args['embed'].to_dict())

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('publish.publish')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_get_channel_map_no_tokens(self, mock_publish, mock_public_url, mock_map_info, mock_get_map):
        mock_get_map.return_value = '1234'
        mock_map_info.return_value = {}
        mock_public_url.return_value = 'public url'

        with self.app.app_context():
            get_channel_map(channel_id='4567', request_params={'token': 'mockToken', 'applicationId': '456'})

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Retrieved Map',
                              'image': {
                                  'url': 'public url'
                              }},
                             args['embed'].to_dict())

    @patch('commands.map.database.get_current_channel_map')
    @patch('publish.publish')
    def test_get_channel_map_no_uuid(self, mock_publish, mock_get_map):
        mock_get_map.return_value = None

        with self.app.app_context():
            get_channel_map(channel_id='4567', request_params={'token': 'mockToken', 'applicationId': '456'})

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Error retrieving map',
                              'description': 'This channel has no map associated with it'
                              }, args['embed'].to_dict())

    @patch('commands.map.database.get_current_channel_map')
    @patch('publish.publish')
    def test_get_channel_map_no_channel(self, mock_publish, mock_get_map):
        with self.app.app_context():
            get_channel_map(channel_id=None, request_params={'token': 'mockToken', 'applicationId': '456'})

        mock_get_map.assert_not_called()

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Error retrieving map',
                              'description': 'Channel ID not found'
                              }, args['embed'].to_dict())

    if __name__ == '__main__':
        unittest.main()
