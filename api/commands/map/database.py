import boto3
from flask import current_app

channels_table = 'channels'
maps_table = 'maps'

dynamodb = boto3.resource('dynamodb')


def update_channel_map(channel_id, new_uuid, is_base=False):
    """
    Updates the channel's current map ID, and adds the previous ID to the channel's history
    :param is_base: (Optional) If True, mark this map as the base map for future tokens to be drawn on top of
    :param channel_id: Discord Channel to update
    :param new_uuid: The Map UUID that will replace the current UUID
    :return: The document Write Result
    """
    table = dynamodb.Table(channels_table)
    channel = table.get_item(
        Key={
            'id': channel_id
        }
    )

    history = []
    if 'Item' in channel:
        previous = channel['Item']['currentMap']
        history = channel['Item']['history']
        history.insert(0, previous)

    table.update_item(
        Key={
            'id': channel_id
        },
        UpdateExpression='SET currentMap = :current, history = :history',
        ExpressionAttributeValues={
            ':current': new_uuid,
            ':history': history
        })

    if is_base:
        table.update_item(
            Key={
                'id': channel_id
            },
            UpdateExpression='SET baseMap = :base',
            ExpressionAttributeValues={
                ':base': new_uuid,
            })


def get_current_channel_map(channel_id):
    """
    Get the current map assigned to this channel ID
    :param channel_id: The channel to search for
    :return: The map UUID, or None if it doesn't exist
    """
    try:
        table = dynamodb.Table(channels_table)
        channel = table.get_item(
            Key={
                'id': channel_id
            }
        )

        if 'Item' in channel:
            return channel['Item']
        else:
            return None
    except Exception as e:
        current_app.logger.warn(e)


def delete_channel_document(channel_id):
    """
    Delete the document named after this channel ID
    :param channel_id: The channel's document to delete
    :return:
    """
    table = dynamodb.Table(channels_table)
    table.delete_item(
        Key={
            'id': channel_id
        }
    )


def create_map_info(uuid: str, data: dict):
    """
    Creates a database entry for the map
    :param uuid: Unique document ID that matches the map ID
    :param data: Dictionary to enter as the map information
    :return: The document Write Result
    """
    table = dynamodb.Table(maps_table)
    table.put_item(
        Item={
            'id': uuid,
            **data
        }
    )


def get_map_info(uuid):
    """
    Gets a database entry for the given map UUID
    :param uuid: The Map UUID that corresponds to this entry.
    :return: The contents of the document as a dict, or an empty dict if the map doesn't exist.
    """

    table = dynamodb.Table(maps_table)
    map = table.get_item(
        Key={
            'id': uuid
        }
    )

    if 'Item' in map:
        return map['Item']
    else:
        return {}
