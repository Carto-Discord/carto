import unittest
from unittest.mock import patch

from flask import Flask
from mockfirestore import MockFirestore

from api.commands.map import database


class DatabaseTest(unittest.TestCase):
    mock_db = MockFirestore()
    app = Flask(__name__)

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
        self.assertFalse('base' in updated)

    @patch('google.cloud.firestore.Client')
    def test_update_doc_is_base(self, mock_client):
        mock_client.return_value = self.mock_db

        database.update_channel_map('1234', '9876', is_base=True)

        updated = self.mock_db.collection('channels').document('1234').get().to_dict()
        self.assertEqual(updated['current'], '9876')
        self.assertEqual(updated['history'], [])
        self.assertEqual(updated['base'], '9876')

    @patch('google.cloud.firestore.Client')
    def test_create_map_info(self, mock_client):
        mock_client.return_value = self.mock_db

        uuid = '1234'
        data = {
            'url': 'url',
            'rows': 2,
            'columns': 3
        }

        with self.app.app_context():
            database.create_map_info(uuid=uuid, data=data)

        updated = self.mock_db.collection('maps').document('1234').get().to_dict()
        self.assertDictEqual(data, updated)

    @patch('google.cloud.firestore.Client')
    def test_get_current_channel_map(self, mock_client):
        mock_client.return_value = self.mock_db
        self.mock_db.collection('channels').document('1234').set({
            'current': '4567',
            'history': [],
            'base': '9876'
        })

        result = database.get_current_channel_map(channel_id='1234')
        self.assertEqual(result['current'], '4567')
        self.assertEqual(result['base'], '9876')

    @patch('google.cloud.firestore.Client')
    def test_get_current_channel_map_not_exists(self, mock_client):
        mock_client.return_value = self.mock_db

        result = database.get_current_channel_map(channel_id='1234')
        self.assertEqual(result, None)

    @patch('google.cloud.firestore.Client')
    def test_delete_channel_document(self, mock_client):
        mock_client.return_value = self.mock_db
        self.mock_db.collection('channels').document('1234').set({
            'current': '4567',
            'history': []
        })

        database.delete_channel_document('1234')
        self.assertFalse(self.mock_db.collection('channels').document('1234').get().exists)

    @patch('google.cloud.firestore.Client')
    def test_get_map_exists(self, mock_client):
        uuid = '1234'
        self.mock_db.collection('maps').document(uuid).set({
            'url': 'url',
            'tokens': [],
            'rows': 2,
            'columns': 3
        })
        mock_client.return_value = self.mock_db

        map_data = database.get_map_info(uuid)

        self.assertEqual(map_data['url'], 'url')
        self.assertEqual(map_data['rows'], 2)
        self.assertEqual(map_data['columns'], 3)
        self.assertEqual(map_data['tokens'], [])

    @patch('google.cloud.firestore.Client')
    def test_get_map_not_exists(self, mock_client):
        mock_client.return_value = self.mock_db

        map_data = database.get_map_info('1234')

        self.assertEqual(map_data, {})
