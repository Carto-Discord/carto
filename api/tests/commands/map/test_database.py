import unittest
from unittest.mock import patch

from mockfirestore import MockFirestore

from api.commands.map import database


class DatabaseTest(unittest.TestCase):
    mock_db = MockFirestore()

    @classmethod
    def setUp(self) -> None:
        self.mock_db.reset()

    @patch('google.cloud.firestore.Client')
    def test_update_doc_exists(self, mock_client):
        self.mock_db.collection('channels').document('1234').set({
            'current': '4567',
            'history': []
        })
        mock_client.return_value = self.mock_db

        database.update_channel_map('1234', '9876')

        updated = self.mock_db.collection('channels').document('1234').get().to_dict()
        self.assertEqual(updated['current'], '9876')
        self.assertEqual(updated['history'], ['4567'])

    @patch('google.cloud.firestore.Client')
    def test_update_doc_not_exists(self, mock_client):
        mock_client.return_value = self.mock_db

        database.update_channel_map('1234', '9876')

        updated = self.mock_db.collection('channels').document('1234').get().to_dict()
        self.assertEqual(updated['current'], '9876')
        self.assertEqual(updated['history'], [])

    @patch('google.cloud.firestore.Client')
    def test_create_map_no_tokens(self, mock_client):
        mock_client.return_value = self.mock_db

        uuid = '1234'
        database.create_map_info(url='url', uuid=uuid, rows=2, columns=3)

        updated = self.mock_db.collection('maps').document('1234').get().to_dict()
        self.assertEqual(updated['url'], 'url')
        self.assertEqual(updated['rows'], 2)
        self.assertEqual(updated['columns'], 3)
        self.assertEqual(updated['tokens'], [])

    @patch('google.cloud.firestore.Client')
    def test_create_map_tokens(self, mock_client):
        mock_client.return_value = self.mock_db

        uuid = '1234'
        token = {'type': 'player'}
        database.create_map_info(url='url', uuid=uuid, rows=2, columns=3, tokens=[token])

        updated = self.mock_db.collection('maps').document('1234').get().to_dict()
        self.assertEqual(updated['url'], 'url')
        self.assertEqual(updated['rows'], 2)
        self.assertEqual(updated['columns'], 3)
        self.assertEqual(updated['tokens'], [token])

    @patch('google.cloud.firestore.Client')
    def test_get_current_channel_map(self, mock_client):
        mock_client.return_value = self.mock_db
        self.mock_db.collection('channels').document('1234').set({
            'current': '4567',
            'history': []
        })

        result = database.get_current_channel_map(channel_id='1234')
        self.assertEqual(result, '4567')

    @patch('google.cloud.firestore.Client')
    def test_get_current_channel_map_not_exists(self, mock_client):
        mock_client.return_value = self.mock_db

        result = database.get_current_channel_map(channel_id='1234')
        self.assertEqual(result, None)
