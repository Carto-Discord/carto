import unittest
from unittest.mock import patch

from api.commands.delete import delete_channel_data


class DeleteTest(unittest.TestCase):

    @patch('commands.map.database.delete_channel_document')
    @patch('publish.publish')
    def test_delete_channel_data(self, mock_publish, mock_delete):
        delete_channel_data(channel_id='1234', request_json={'token': 'mockToken', 'applicationId': '345'})
        mock_delete.assert_called()
        mock_publish.assert_called_with(token='mockToken', application_id='345', message='Channel data deleted')


if __name__ == '__main__':
    unittest.main()
