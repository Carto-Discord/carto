import unittest
from unittest.mock import patch

from api.commands.token import add_token, move_token, delete_token


@patch('publish.publish')
class TokenAddTest(unittest.TestCase):

    @patch('commands.map.database.get_current_channel_map')
    def test_invalid_size(self, mock_get_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'VERY_SMALL',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        with self.assertRaises(SystemExit):
            add_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message='Size VERY_SMALL is invalid. Valid sizes are as in the D&D Basic Rules')
        mock_get_map.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    def test_invalid_map_id(self, mock_map_info, mock_get_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = None

        with self.assertRaises(SystemExit):
            add_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message="No map exists for this channel. Create one with the /map create command")
        mock_map_info.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    def test_invalid_map_data(self, mock_apply_grid, mock_map_info, mock_get_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'tokens': []
        }

        with self.assertRaises(SystemExit):
            add_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message="Map data for this channel is incomplete. Please report this as an issue on GitHub")
        mock_apply_grid.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    def test_invalid_rows_cols_provided(self, mock_apply_grid, mock_map_info, mock_get_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'rows': 2,
            'columns': 2,
            'tokens': []
        }

        with self.assertRaises(SystemExit):
            add_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message="The row or column you entered is not on the map, please try again. "
                                                "This map's bounds are 2 rows by 2 columns")
        mock_apply_grid.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    def test_grid_cannot_be_created(self, mock_upload, mock_apply_grid, mock_map_info, mock_get_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_map.return_value = '4567'
        mock_map_info.return_value = {
            'url': 'url',
            'rows': 5,
            'columns': 5,
            'tokens': []
        }
        mock_apply_grid.return_value = None

        with self.assertRaises(SystemExit):
            add_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message="Url url could not be found")
        mock_upload.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    def test_image_cannot_be_uploaded(self, mock_update, mock_upload, mock_apply_grid, mock_map_info, mock_get_map,
                                      mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'token': 'mockToken',
            'applicationId': '5678'
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

        add_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message="Map could not be created")
        mock_update.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('uuid.uuid4')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_successful_creation(self, mock_uuid, mock_create, mock_update, mock_upload, mock_apply_grid, mock_map_info,
                                 mock_get_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'size': 'MEDIUM',
            'colour': 'red',
            'token': 'mockToken',
            'applicationId': '5678'
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
        mock_uuid.return_value = '1234-5678'

        add_token(request)

        mock_update.assert_called_once()
        mock_create.assert_called_with(uuid='1234-5678', url='url', rows=5, columns=5, tokens=[{
            'name': 'token',
            'row': 4,
            'column': 'C',
            'colour': 'red',
            'size': 1
        }])

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        image_url='gcs-file')


@patch('publish.publish')
class TokenMoveTest(unittest.TestCase):

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    def test_name_not_found(self, mock_apply_grid, mock_get_map_info, mock_get_channel_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '1',
            'column': 'A',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = '4567'
        mock_get_map_info.return_value = {
            'url': 'url',
            'rows': 2,
            'columns': 2,
            'tokens': [
                {
                    'name': 'not_token',
                    'row': 1,
                    'column': 'A',
                    'size': 1,
                    'colour': 'red'
                }
            ]
        }

        with self.assertRaises(SystemExit):
            move_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message='Token token not found in map. Token names are case sensitive, so try again or add it using /token add')
        mock_apply_grid.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_changes_token_attributes(self, mock_create_map_info, mock_update_channel, mock_upload_blob,
                                      mock_apply_grid, mock_get_map_info, mock_get_channel_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'row': '4',
            'column': 'C',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = '4567'
        mock_get_map_info.return_value = {
            'url': 'url',
            'rows': 5,
            'columns': 5,
            'tokens': [
                {
                    'name': 'token',
                    'row': 1,
                    'column': 'A',
                    'size': 1,
                    'colour': 'red'
                }
            ]
        }

        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        move_token(request)

        tokens = mock_apply_grid.call_args.kwargs['tokens']
        self.assertEqual(tokens[0].row, 4)
        self.assertEqual(tokens[0].column, 'C')


@patch('publish.publish')
class TokenDeleteTest(unittest.TestCase):

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    def test_name_not_found(self, mock_apply_grid, mock_get_map_info, mock_get_channel_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = '4567'
        mock_get_map_info.return_value = {
            'url': 'url',
            'rows': 2,
            'columns': 2,
            'tokens': [
                {
                    'name': 'not_token',
                    'row': 1,
                    'column': 'A',
                    'size': 1,
                    'colour': 'red'
                }
            ]
        }

        with self.assertRaises(SystemExit):
            delete_token(request)

        mock_publish.assert_called_with(token='mockToken', application_id='5678',
                                        message='Token token not found in map. Token names are case sensitive, so try again or add it using /token add')
        mock_apply_grid.assert_not_called()

    @patch('commands.map.database.get_current_channel_map')
    @patch('commands.map.database.get_map_info')
    @patch('commands.map.grid.apply_grid')
    @patch('commands.map.storage.upload_blob')
    @patch('commands.map.database.update_channel_map')
    @patch('commands.map.database.create_map_info')
    @patch('commands.constants.BUCKET', 'bucket')
    def test_changes_token_attributes(self, mock_create_map_info, mock_update_channel, mock_upload_blob,
                                      mock_apply_grid, mock_get_map_info, mock_get_channel_map, mock_publish):
        request = {
            'channelId': '1234',
            'name': 'token',
            'token': 'mockToken',
            'applicationId': '5678'
        }

        mock_get_channel_map.return_value = '4567'
        mock_get_map_info.return_value = {
            'url': 'url',
            'rows': 5,
            'columns': 5,
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

        mock_apply_grid.return_value = 'map.png'
        mock_upload_blob.return_value = 'gcs-file'

        delete_token(request)

        tokens = mock_apply_grid.call_args.kwargs['tokens']
        self.assertEqual(tokens[0].row, 3)
        self.assertEqual(tokens[0].column, 'B')


if __name__ == '__main__':
    unittest.main()
