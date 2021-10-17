from decimal import Decimal
import unittest

import boto3
from flask import Flask
from moto import mock_dynamodb2


@mock_dynamodb2
class DatabaseTest(unittest.TestCase):
    app = Flask(__name__)

    def setUp(self) -> None:
        self.dynamodb = boto3.resource('dynamodb')
        self.map_table = self.dynamodb.create_table(
            TableName='maps',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                }
            ],
        )
        self.channel_table = self.dynamodb.create_table(
            TableName='channels',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                }
            ],
        )

    def tearDown(self) -> None:
        self.map_table.delete()
        self.channel_table.delete()
        self.dynamodb = None

    def test_update_doc_exists(self):
        from api.commands.map import database

        self.channel_table.put_item(
            Item={
                'id': '1234',
                'currentMap': '4567',
                'history': []
            }
        )

        database.update_channel_map('1234', '9876')

        updated = self.channel_table.get_item(
            Key={
                'id': '1234'
            })['Item']
        self.assertEqual(updated['currentMap'], '9876')
        self.assertEqual(updated['history'], ['4567'])

    def test_update_doc_not_exists(self):
        from api.commands.map import database

        database.update_channel_map('1234', '9876')

        updated = self.channel_table.get_item(
            Key={
                'id': '1234'
            })['Item']
        self.assertEqual(updated['currentMap'], '9876')
        self.assertEqual(updated['history'], [])
        self.assertFalse('baseMap' in updated)

    def test_update_doc_is_base(self):
        from api.commands.map import database

        database.update_channel_map('1234', '9876', is_base=True)

        updated = self.channel_table.get_item(
            Key={
                'id': '1234'
            })['Item']
        self.assertEqual(updated['currentMap'], '9876')
        self.assertEqual(updated['history'], [])
        self.assertEqual(updated['baseMap'], '9876')

    def test_create_map_info(self):
        from api.commands.map import database

        uuid = '1234'
        data = {
            'url': 'url',
            'rows': Decimal('2'),
            'columns': Decimal('3')
        }

        with self.app.app_context():
            database.create_map_info(uuid=uuid, data=data)

        updated = self.map_table.get_item(
            Key={
                'id': uuid
            })['Item']
        self.assertDictEqual({'id': uuid, **data}, updated)

    def test_get_current_channel_map(self):
        from api.commands.map import database

        self.channel_table.put_item(
            Item={
                'id': '1234',
                'currentMap': '4567',
                'history': [],
                'baseMap': '9876'
            }
        )

        result = database.get_current_channel_map(channel_id='1234')
        self.assertEqual(result['currentMap'], '4567')
        self.assertEqual(result['baseMap'], '9876')

    def test_get_current_channel_map_not_exists(self):
        from api.commands.map import database

        result = database.get_current_channel_map(channel_id='1234')
        self.assertEqual(result, None)

    def test_delete_channel_document(self):
        from api.commands.map import database

        self.channel_table.put_item(
            Item={
                'id': '1234',
                'currentMap': '4567',
                'history': []
            }
        )

        database.delete_channel_document('1234')

        updated = self.channel_table.get_item(
            Key={
                'id': '1234'
            })
        self.assertFalse('Item' in updated)

    def test_get_map_exists(self):
        from api.commands.map import database
        uuid = '1234'

        self.map_table.put_item(
            Item={
                'id': uuid,
                'url': 'url',
                'tokens': [],
                'rows': 2,
                'columns': 3
            }
        )

        map_data = database.get_map_info(uuid)

        self.assertEqual(map_data['url'], 'url')
        self.assertEqual(map_data['rows'], 2)
        self.assertEqual(map_data['columns'], 3)
        self.assertEqual(map_data['tokens'], [])

    def test_get_map_not_exists(self):
        from api.commands.map import database

        map_data = database.get_map_info('1234')

        self.assertEqual(map_data, {})
