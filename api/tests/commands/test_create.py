import unittest
from unittest.mock import patch

from api.commands.create import create_new_map


@patch('commands.map.grid.create_grid')
@patch('publish.publish')
class CreateTest(unittest.TestCase):

    def test_create_invalid_url(self, mock_publish, mock_create_grid):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'token': 'mockToken',
            'applicationId': '456'
        }
        mock_publish.return_value = 'published'
        mock_create_grid.return_value = None

        create_new_map(channel_id='1234', request_json=params)
        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Map create error',
                              'description': 'URL https://mock.url could not be found.\nMake sure it is public and includes the file extension'},
                             args['embed'].to_dict())

    @patch('commands.map.storage.upload_blob')
    def test_create_unable_to_upload(self, mock_upload_blob, mock_publish, mock_create_grid):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'token': 'mockToken',
            'applicationId': '456'
        }
        mock_create_grid.return_value = 'map.png'
        mock_upload_blob.return_value = None

        create_new_map(channel_id='1234', request_json=params)
        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Map create error',
                              'description': 'Map could not be created due to an internal error.\nTry again later, or [report it](https://www.github.com/carto-discord/carto/issues).'},
                             args['embed'].to_dict())

    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    def test_create_success(self, mock_create_map_info, mock_update_channel_map, mock_upload_blob,
                            mock_publish, mock_create_grid):
        params = {
            'url': 'https://mock.url',
            'rows': 42,
            'columns': 24,
            'token': 'mockToken',
            'applicationId': '456'
        }
        mock_create_grid.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        create_new_map(channel_id='1234', request_json=params)

        mock_update_channel_map.assert_called()
        mock_create_map_info.assert_called()

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Map created',
                              'fields': [
                                  {
                                      'name': 'Rows',
                                      'value': '42',
                                      'inline': True
                                  },
                                  {
                                      'name': 'Columns',
                                      'value': '24',
                                      'inline': True
                                  }
                              ],
                              'image': {
                                  'url': 'gcs-file'
                              }},
                             args['embed'].to_dict())


if __name__ == '__main__':
    unittest.main()
