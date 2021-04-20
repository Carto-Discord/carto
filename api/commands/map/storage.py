import logging

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

        logging.log(level=logging.INFO, msg="File {} uploaded to {}.".format(
            source_file_name, destination_blob_name
        ))

        return blob.name
    except GoogleCloudError as e:
        logging.log(level=logging.ERROR, msg="File {} could not be uploaded to {}. Reason: {}".format(
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

        logging.log(level=logging.INFO, msg="Blob {} downloaded to {}.".format(
            source_blob_name, destination_file_name
        ))

        return True
    except NotFound as e:
        logging.log(level=logging.ERROR, msg="File {} could not be downloaded from {} to {} Reason: {}".format(
            source_blob_name, bucket_name, destination_file_name, e
        ))
        return False
