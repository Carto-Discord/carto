import os

from botocore.exceptions import ClientError
from flask import current_app

from api.commands.map.client import s3

region = os.getenv('AWS_REGION')


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    # bucket_name = "your-bucket-name"
    # source_file_name = "local/path/to/file"
    # destination_blob_name = "storage-object-name"

    try:
        s3.upload_file(source_file_name, bucket_name,
                       destination_blob_name)

        current_app.logger.info("File {} uploaded to {}.".format(
            source_file_name, destination_blob_name
        ))

        if os.path.exists(source_file_name):
            os.remove(source_file_name)

        return get_public_url(bucket_name, destination_blob_name)
    except Exception as e:
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
        s3.download_file(bucket_name, source_blob_name,
                         destination_file_name)

        current_app.logger.info("Blob {} downloaded to {}.".format(
            source_blob_name, destination_file_name
        ))

        return True
    except ClientError as e:
        current_app.logger.warn("File {} could not be downloaded from {} to {} Reason: {}".format(
            source_blob_name, bucket_name, destination_file_name, e
        ))
        return False


def get_public_url(bucket_name, file_name):
    return 'https://s3.{}.amazonaws.com/{}/{}'.format(region, bucket_name, file_name)
