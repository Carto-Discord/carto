import os

from flask import current_app

from google.cloud import storage
from google.cloud.exceptions import GoogleCloudError, NotFound


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    # bucket_name = "your-bucket-name"
    # source_file_name = "local/path/to/file"
    # destination_blob_name = "storage-object-name"

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        blob.upload_from_filename(source_file_name)

        current_app.logger.info("File {} uploaded to {}.".format(
            source_file_name, destination_blob_name
        ))

        if os.path.exists(source_file_name):
            os.remove(source_file_name)

        return blob.public_url
    except GoogleCloudError as e:
        current_app.logger.warn("File {} could not be uploaded to {}. Reason: {}".format(
            source_file_name, destination_blob_name, e
        ))
        return None


def download_blob(bucket_name, source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    # bucket_name = "your-bucket-name"
    # source_blob_name = "storage-object-name"
    # destination_file_name = "local/path/to/file"

    try:
        storage_client = storage.Client()

        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(source_blob_name)
        blob.download_to_filename(destination_file_name)

        current_app.logger.info("Blob {} downloaded to {}.".format(
            source_blob_name, destination_file_name
        ))

        return True
    except NotFound as e:
        current_app.logger.warn("File {} could not be downloaded from {} to {} Reason: {}".format(
            source_blob_name, bucket_name, destination_file_name, e
        ))
        return False


def get_public_url(bucket_name, file_name):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)

        return blob.public_url
    except NotFound as e:
        current_app.logger.warn("Map {} could not be found in {}. Reason: {}".format(
            file_name, bucket_name, e
        ))
        return None
