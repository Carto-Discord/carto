import unittest
from unittest.mock import patch

from api.commands.get import get_channel_map


@patch('logs.Logger.log')
class GetTest(unittest.TestCase):
    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('publish.publish')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_get_channel_map(self, mock_publish, mock_public_url, mock_map_info, mock_get_map, mock_log):
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
        mock_public_url.return_value = 'public url'

        get_channel_map({'channelId': '4567', 'token': 'mockToken', 'applicationId': '456'})
        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='Tokens on map:\ntoken1: (AA, 4)\ntoken2: (B, 7)\n',
                                        image_url='public url')

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('publish.publish')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_get_channel_map_no_tokens(self, mock_publish, mock_public_url, mock_map_info, mock_get_map, mock_log):
        mock_get_map.return_value = '1234'
        mock_map_info.return_value = {}
        mock_public_url.return_value = 'public url'

        get_channel_map({'channelId': '4567', 'token': 'mockToken', 'applicationId': '456'})

        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='', image_url='public url')

    @patch('commands.map.database.get_current_channel_map')
    @patch('publish.publish')
    def test_get_channel_map_no_uuid(self, mock_publish, mock_get_map, mock_log):
        mock_get_map.return_value = None

        get_channel_map({'channelId': '4567', 'token': 'mockToken', 'applicationId': '456'})
        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='This channel has no current map associated')

    @patch('publish.publish')
    def test_get_channel_map_no_id(self, mock_publish, mock_log):
        get_channel_map({ 'token': 'mockToken', 'applicationId': '456'})

        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='No channel found')


if __name__ == '__main__':
    unittest.main()
