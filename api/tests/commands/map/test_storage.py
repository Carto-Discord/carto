import os
from shutil import copyfile
import unittest

import boto3
from flask import Flask
from moto import mock_s3

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))


@mock_s3
class StorageTest(unittest.TestCase):
    app = Flask(__name__)
    bucket_name = 'maps'

    def setUp(self) -> None:
        self.s3 = boto3.resource('s3')
        bucket = self.s3.Bucket(self.bucket_name)
        bucket.create(CreateBucketConfiguration={
            'LocationConstraint': 'af-south-1'
        })

    def tearDown(self) -> None:
        self.s3.Bucket(self.bucket_name).objects.delete()
        self.s3.Bucket(self.bucket_name).delete()
        self.s3 = None

    def test_upload_blob_successful(self):
        from api.commands.map import storage

        original_file = os.path.join(__location__, 'test_map.png')
        new_file = os.path.join(__location__, 'test_map_copy.png')
        copyfile(original_file, new_file)

        with self.app.app_context():
            url = storage.upload_blob(
                self.bucket_name, new_file, 'test_map.png')

        self.assertEquals(
            url, 'https://maps.s3.amazonaws.com/test_map.png')

    def test_upload_blob_unsuccessful(self):
        from api.commands.map import storage

        with self.app.app_context():
            url = storage.upload_blob(
                self.bucket_name, 'unknown_file', 'test_map.png')

        self.assertIsNone(url)

    def test_download_blob_successful(self):
        from api.commands.map import storage

        original_file = os.path.join(__location__, 'test_map.png')
        new_file = os.path.join(__location__, 'test_map_copy.png')
        copyfile(original_file, new_file)

        self.assertTrue(os.path.exists(new_file))

        with self.app.app_context():
            storage.upload_blob(
                self.bucket_name, new_file, 'test_map.png')

            self.assertFalse(os.path.exists(new_file))

            downloaded = storage.download_blob(
                self.bucket_name, 'test_map.png', new_file)

        self.assertTrue(os.path.exists(new_file))
        self.assertTrue(downloaded)

        os.remove(new_file)

    def test_download_blob_unsuccessful(self):
        from api.commands.map import storage

        file = os.path.join(__location__, 'test_map_copy.png')

        with self.app.app_context():

            downloaded = storage.download_blob(
                self.bucket_name, 'test_map.png', file)

        self.assertFalse(os.path.exists(file))
        self.assertFalse(downloaded)
