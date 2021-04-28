from google.cloud import logging

logging_client = logging.Client()
logging_client.get_default_handler()
logging_client.setup_logging()