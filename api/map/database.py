from google.cloud import firestore

channels_collection = 'channels'


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
