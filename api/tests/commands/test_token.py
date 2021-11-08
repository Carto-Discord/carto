import unittest
from unittest.mock import patch

from werkzeug.exceptions import HTTPException

from api.commands.token import add_token, move_token, delete_token


@patch('publish.publish')
class TokenAddTest(unittest.TestCase):

    @patch('commands.map.database.get_current_channel_map')
    def test_invalid_size(self, mock_get_map, mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'VERY_SMALL',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        with self.assertRaises(HTTPException):
            add_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'Size VERY_SMALL is invalid.\n'
                                             'Valid sizes are as in the '
                                             '[D&D Basic Rules](https://www.dndbeyond.com/sources/basic-rules/monsters#Size)'},
                             args['embed'].to_dict())

        mock_get_map.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    def test_invalid_map_id(self, mock_map_info, mock_get_map, mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = None

        with self.assertRaises(HTTPException):
            add_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'No map exists for this channel.\nCreate one with the /map create command'
                              },
                             args['embed'].to_dict())
        mock_map_info.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_tokens')
    def test_invalid_map_data(self, mock_apply_tokens, mock_map_info, mock_get_map, mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = {'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 2
                }
            else:
                return {
                    'tokens': []
                }

        mock_map_info.side_effect = map_info_side_effect

        with self.assertRaises(HTTPException):
            add_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'Map data for this channel is incomplete. '
                                             'Create the map again or [report it](https://www.github.com/carto-discord/carto/issues).'
                              },
                             args['embed'].to_dict())

        mock_apply_tokens.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    def test_invalid_rows_cols_provided(self, mock_apply_tokens, mock_get_public_url, mock_map_info, mock_get_map,
                                        mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = {'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 2,
                    'columns': 2,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': []
                }

        mock_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'

        with self.assertRaises(HTTPException):
            add_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': "The row or column you entered is out of bounds. "
                                             "This map's bounds are 2 rows by 2 columns"
                              },
                             args['embed'].to_dict())
        mock_apply_tokens.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    @patch('commands.map.storage.upload_blob')
    def test_grid_cannot_be_created(self, mock_upload, mock_apply_tokens, mock_get_public_url, mock_map_info,
                                    mock_get_map, mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = {'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 5,
                    'columns': 5,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': []
                }

        mock_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'

        mock_apply_tokens.return_value = None

        with self.assertRaises(HTTPException):
            add_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'Map could not be recreated. Reason: Original map could not be found'
                              },
                             args['embed'].to_dict())

        mock_upload.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    def test_image_cannot_be_uploaded(self, mock_update, mock_upload, mock_apply_tokens, mock_get_public_url,
                                      mock_map_info, mock_get_map, mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = {'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 5,
                    'columns': 5,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': []
                }

        mock_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'
        mock_apply_tokens.return_value = 'map.png'
        mock_upload.return_value = None

        add_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'Map could not be created'
                              },
                             args['embed'].to_dict())

        mock_update.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('uuid.uuid4')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_successful_creation(self, mock_uuid, mock_create, mock_update, mock_upload, mock_apply_tokens,
                                 mock_get_public_url, mock_map_info, mock_get_map, mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'colour': 'red',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = {'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 5,
                    'columns': 5,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': []
                }

        mock_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'
        mock_apply_tokens.return_value = 'map.png'
        mock_upload.return_value = 'gcs-file'
        mock_uuid.return_value = '1234-5678'

        add_token(channel_id='1234', request_json=request)

        mock_update.assert_called_once()

        map_data = {
            'tokens': [{
                'name': 'token',
                'row': 4,
                'column': 'C',
                'colour': 'red',
                'size': 1
            }]
        }
        mock_create.assert_called_with(uuid='1234-5678', data=map_data)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Tokens updated',
                              'description': 'Token positions:',
                              'fields': [
                                  {
                                      'name': 'token',
                                      'value': 'C4',
                                      'inline': True
                                  }
                              ],
                              'image': {
                                  'url': 'gcs-file'
                              }
                              },
                             args['embed'].to_dict())


@patch('publish.publish')
class TokenMoveTest(unittest.TestCase):

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    def test_name_not_found(self, mock_apply_tokens, mock_get_public_url, mock_get_map_info, mock_get_channel_map,
                            mock_publish):
        request = {
            'name': 'token',
            'row': '1',
            'column': 'A',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = {
            'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 2,
                    'columns': 2,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': [{
                        'name': 'not_token',
                        'row': 1,
                        'column': 'A',
                        'size': 1,
                        'colour': 'red'
                    }]
                }

        mock_get_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'

        with self.assertRaises(HTTPException):
            move_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'Token token not found in map. '
                                             'Token names are case sensitive, so try again or add it using /token add',
                              },
                             args['embed'].to_dict())
        mock_apply_tokens.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_changes_token_attributes(self, mock_create_map_info, mock_update_channel, mock_upload_blob,
                                      mock_apply_tokens, mock_get_public_url, mock_get_map_info, mock_get_channel_map,
                                      mock_publish):
        request = {
            'name': 'token',
            'row': '4',
            'column': 'C',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = {
            'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 5,
                    'columns': 5,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': [{
                        'name': 'token',
                        'row': 1,
                        'column': 'A',
                        'size': 1,
                        'colour': 'red'
                    }]
                }

        mock_get_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'

        mock_apply_tokens.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        move_token(channel_id='1234', request_json=request)

        tokens = mock_apply_tokens.call_args.kwargs['tokens']
        self.assertEqual(tokens[0].row, 4)
        self.assertEqual(tokens[0].column, 'C')


@patch('publish.publish')
class TokenDeleteTest(unittest.TestCase):

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    def test_name_not_found(self, mock_apply_tokens, mock_get_public_url, mock_get_map_info, mock_get_channel_map,
                            mock_publish):
        request = {
            'name': 'token',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = {
            'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 5,
                    'columns': 5,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': [{
                        'name': 'not_token',
                        'row': 1,
                        'column': 'A',
                        'size': 1,
                        'colour': 'red'
                    }]
                }

        mock_get_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'

        with self.assertRaises(HTTPException):
            delete_token(channel_id='1234', request_json=request)

        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('5678', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Token Error',
                              'description': 'Token token not found in map. '
                                             'Token names are case sensitive, so try again or add it using /token add',
                              },
                             args['embed'].to_dict())
        mock_apply_tokens.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.storage.get_public_url')
    @patch('commands.map.grid.apply_tokens')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_changes_token_attributes(self, mock_create_map_info, mock_update_channel, mock_upload_blob,
                                      mock_apply_tokens, mock_get_public_url, mock_get_map_info, mock_get_channel_map,
                                      mock_publish):
        request = {
            'name': 'token',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = {
            'currentMap': '4567', 'baseMap': '9876'}

        def map_info_side_effect(*args, **kwargs):
            if args[0] == '9876':
                return {
                    'url': 'url',
                    'rows': 5,
                    'columns': 5,
                    'margin_x': 32,
                    'margin_y': 32
                }
            else:
                return {
                    'tokens': [
                        {
                            'name': 'token',
                            'row': 1,
                            'column': 'A',
                            'size': 1,
                            'colour': 'red'
                        },
                        {
                            'name': 'not_token',
                            'row': 3,
                            'column': 'B',
                            'size': 1,
                            'colour': 'blue'
                        }
                    ]
                }

        mock_get_map_info.side_effect = map_info_side_effect
        mock_get_public_url.return_value = 'gcs-url'

        mock_apply_tokens.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        delete_token(channel_id='1234', request_json=request)

        tokens = mock_apply_tokens.call_args.kwargs['tokens']
        self.assertEqual(tokens[0].row, 3)
        self.assertEqual(tokens[0].column, 'B')


if __name__ == '__main__':
    unittest.main()
