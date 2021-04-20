from google.cloud import firestore

channels_collection = 'channels'
maps_collection = 'maps'


def update_channel_map(channel_id, new_uuid):
    """
    Updates the channel's current map ID, and adds the previous ID to the channel's history
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

    return channel_doc_ref.set({
        'current': new_uuid,
        'history': history
    }, merge=True)


def create_map_info(uuid, url, rows, columns, tokens=None):
    """
    Creates a database entry for the map
    :param uuid: The Map UUID that corresponds to this entry. It should be the same as the most recent map
    :param url: URL for the map image
    :param rows: The number of rows in the grid
    :param columns: The number of columns in the grid
    :param tokens: The tokens present on the map. If omitted, this is an empty array
    :return: The document Write Result
    """
    if tokens is None:
        tokens = []
    db = firestore.Client()
    map_doc_ref = db.collection(maps_collection).document(uuid)

    # If this UUID collides with another (unlikely, near impossible), we just overwrite it.
    return map_doc_ref.set({
        'url': url,
        'rows': rows,
        'columns': columns,
        'tokens': tokens,
    })


def get_current_channel_map(channel_id):
    """
    Get the current map assigned to this channel ID
    :param channel_id: The channel to search for
    :return: The map UUID, or None if it doesn't exist
    """
    db = firestore.Client()
    channel_doc_ref = db.collection(channels_collection).document(channel_id)
    channel_doc = channel_doc_ref.get()

    if channel_doc.exists:
        return channel_doc.to_dict()['current']
    else:
        return None
