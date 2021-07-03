import json
import unittest
from unittest.mock import patch

from flask import Flask

from api.commands.delete import delete_channel_data


@patch('publish.publish')
@patch('commands.map.database.delete_channel_document')
class DeleteTest(unittest.TestCase):
    app = Flask(__name__)

    def test_delete_channel_data_no_channel(self, mock_delete, mock_publish):
        with self.app.app_context():
            response = delete_channel_data()

        mock_delete.assert_not_called()
        self.assertDictEqual(json.loads(response[0].get_data(as_text=True)),
                             {'deleted': False, 'message': 'No channel provided'})

    def test_delete_channel_data_no_request_json(self, mock_delete, mock_publish):
        with self.app.app_context():
            response = delete_channel_data(channel_id='1234')

        mock_delete.assert_not_called()
        self.assertDictEqual(json.loads(response[0].get_data(as_text=True)),
                             {'deleted': False, 'message': 'No discord token provided'})

    def test_delete_channel_data_exception(self, mock_delete, mock_publish):
        mock_delete.side_effect = Exception

        with self.app.app_context():
            delete_channel_data(channel_id='1234',
                                request_json={'token': 'mockToken', 'applicationId': '456'})

        mock_delete.assert_called()
        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Deletion error',
                              'description': "Data couldn't be deleted, likely because it never existed"
                              },
                             args['embed'].to_dict())

    def test_delete_channel_data(self, mock_delete, mock_publish):
        with self.app.app_context():
            delete_channel_data(channel_id='1234',
                                request_json={'token': 'mockToken', 'applicationId': '456'})

        mock_delete.assert_called()
        args = mock_publish.call_args.kwargs
        self.assertEqual('mockToken', args['token'])
        self.assertEqual('456', args['application_id'])
        self.assertDictEqual({'type': 'rich',
                              'title': 'Channel data deleted',
                              'description': "All related maps will be erased from Carto within 24 hours"
                              },
                             args['embed'].to_dict())


if __name__ == '__main__':
    unittest.main()
