import unittest
from unittest.mock import patch

from api.commands.delete import delete_channel_data


class DeleteTest(unittest.TestCase):

    @patch('commands.map.database.delete_channel_document')
    @patch('publish.publish')
    def test_delete_channel_data(self, mock_publish, mock_delete):
        delete_channel_data({'channelId': '1234', 'token': 'mockToken', 'applicationId': '345'})
        mock_delete.assert_called()
        mock_publish.assert_called_with(token='mockToken', application_id='345', message='Channel data deleted')

    @patch('publish.publish')
    def test_delete_channel_data_no_id(self, mock_publish):
        delete_channel_data({'token': 'mockToken', 'applicationId': '345'})
        mock_publish.assert_called_with(token='mockToken', application_id='345', message="No channel found")


if __name__ == '__main__':
    unittest.main()
