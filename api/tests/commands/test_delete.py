import unittest
from unittest.mock import patch

from flask import Flask
from werkzeug.exceptions import HTTPException

from api.commands.delete import delete_channel_data


class DeleteTest(unittest.TestCase):
    app = Flask(__name__)

    @patch('commands.map.database.delete_channel_document')
    def test_delete_channel_data(self, mock_delete):
        with self.app.app_context():
            response = delete_channel_data({'channelId': '1234'})
            mock_delete.assert_called()
            self.assertEqual(response[1], 204)

    def test_delete_channel_data_no_id(self):
        with self.app.app_context():
            with self.assertRaises(HTTPException) as http_error:
                delete_channel_data({})
                self.assertEqual(http_error.exception.code, 400)


if __name__ == '__main__':
    unittest.main()
