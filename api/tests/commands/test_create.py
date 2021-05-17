import unittest
from unittest.mock import patch

from api.commands.create import create_new_map


class CreateTest(unittest.TestCase):
    @patch('commands.map.grid.apply_grid')
    @patch('publish.publish')
    def test_create_invalid_url(self, mock_publish, mock_apply_grid):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'token': 'mockToken',
            'applicationId': '456'
        }
        mock_publish.return_value = 'published'
        mock_apply_grid.return_value = None

        create_new_map(channel_id='1234', request_json=params)
        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='Url https://mock.url could not be found')

    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('publish.publish')
    def test_create_unable_to_upload(self, mock_publish, mock_upload_blob, mock_apply_grid):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'token': 'mockToken',
            'applicationId': '456'
        }
        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = None

        create_new_map(channel_id='1234', request_json=params)
        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='Map could not be created')

    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('publish.publish')
    def test_create_success(self, mock_publish, mock_create_map_info, mock_update_channel_map, mock_upload_blob,
                            mock_apply_grid):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'token': 'mockToken',
            'applicationId': '456'
        }
        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        create_new_map(channel_id='1234', request_json=params)

        mock_update_channel_map.assert_called()
        mock_create_map_info.assert_called()

        mock_publish.assert_called_with(token='mockToken', application_id='456',
                                        message='Map created', image_url='gcs-file')


if __name__ == '__main__':
    unittest.main()
