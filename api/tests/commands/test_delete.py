import json
import unittest
from unittest.mock import patch

from flask import Flask

from api.commands.delete import delete_channel_data


@patch('commands.map.database.delete_channel_document')
class DeleteTest(unittest.TestCase):
    app = Flask(__name__)

    def test_delete_channel_data_no_channel(self, mock_delete):
        with self.app.app_context():
            response = delete_channel_data()

        mock_delete.assert_not_called()
        self.assertDictEqual(json.loads(response[0].get_data(as_text=True)),
                             {'deleted': False, 'channel': 'No channel provided'})

    def test_delete_channel_data(self, mock_delete):
        with self.app.app_context():
            response = delete_channel_data(channel_id='1234')

        mock_delete.assert_called()
        self.assertDictEqual(json.loads(response[0].get_data(as_text=True)), {'deleted': True, 'channel': '1234'})


if __name__ == '__main__':
    unittest.main()
