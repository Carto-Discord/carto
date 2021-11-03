import os

import boto3

endpoint = os.getenv('AWS_ENDPOINT')

if endpoint is not None:
    dynamodb = boto3.resource('dynamodb',
                              endpoint_url=endpoint,
                              use_ssl=False,
                              aws_access_key_id='test',
                              aws_secret_access_key='test',
                              region_name='us-east-1')
    s3 = boto3.client('s3',
                      endpoint_url=endpoint,
                      use_ssl=False,
                      aws_access_key_id='test',
                      aws_secret_access_key='test',
                      region_name='us-east-1')
else:
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')
