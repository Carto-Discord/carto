from flask import current_app
from google.cloud import firestore

channels_collection = 'channels'
maps_collection = 'maps'


def update_channel_map(channel_id, new_uuid, is_base=False):
    """
    Updates the channel's current map ID, and adds the previous ID to the channel's history
    :param is_base: (Optional) If True, mark this map as the base map for future tokens to be drawn on top of
    :param channel_id: Discord Channel to update
    :param new_uuid: The Map UUID that will replace the current UUID
    :return: The document Write Result
    """
    db = firestore.Client()
    channel_doc_ref = db.collection(channels_collection).document(channel_id)
    channel_doc = channel_doc_ref.get()

    history = []
    if channel_doc.exists:
        previous = channel_doc.to_dict()['current']
        history = channel_doc.to_dict()['history']
        history.insert(0, previous)

    new_dict = {
        'current': new_uuid,
        'history': history
    }

    if is_base:
        new_dict['base'] = new_uuid

    return channel_doc_ref.set(new_dict, merge=True)


def get_current_channel_map(channel_id):
    """
    Get the current map assigned to this channel ID
    :param channel_id: The channel to search for
    :return: The map UUID, or None if it doesn't exist
    """
    try:
        db = firestore.Client()
        channel_doc_ref = db.collection(channels_collection).document(channel_id)
        channel_doc = channel_doc_ref.get()

        if channel_doc.exists:
            return channel_doc.to_dict()['current']
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
    db = firestore.Client()
    channel_doc_ref = db.collection(channels_collection).document(channel_id)
    channel_doc = channel_doc_ref.get()

    if channel_doc.exists:
        channel_doc_ref.delete()


def create_map_info(uuid: str, data: dict):
    """
    Creates a database entry for the map
    :param uuid: Unique document ID that matches the map ID
    :param data: Dictionary to enter as the map information
    :return: The document Write Result
    """
    db = firestore.Client()
    map_doc_ref = db.collection(maps_collection).document(uuid)

    # If this UUID collides with another (unlikely, near impossible), we just overwrite it.
    return map_doc_ref.set(data)


def get_map_info(uuid):
    """
    Gets a database entry for the given map UUID
    :param uuid: The Map UUID that corresponds to this entry.
    :return: The contents of the document as a dict, or an empty dict if the map doesn't exist.
    """

    db = firestore.Client()
    map_doc_ref = db.collection(maps_collection).document(uuid)
    map_doc = map_doc_ref.get()

    if map_doc.exists:
        return map_doc.to_dict()
    else:
        return {}
