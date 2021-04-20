import unittest
from unittest.mock import patch

from mockfirestore import MockFirestore

from api.map import database


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
