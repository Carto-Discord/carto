from google.cloud.logging import Client, Resource


class Logger(object):
    res = None
    logger = None
    execution_id = None

    @staticmethod
    def setup(execution_id):
        log_client = Client()
        log_name = 'cloudfunctions.googleapis.com%2Fcloud-functions'
        Logger.execution_id = execution_id
        Logger.res = Resource(type="cloud_function",
                              labels={
                                  "function_name": "carto-api",
                              })
        Logger.logger = log_client.logger(log_name)

    @staticmethod
    def log(message, severity='INFO'):
        Logger.logger.log_struct({"message": message},
                                 resource=Logger.res,
                                 severity=severity,
                                 labels={'execution_id': Logger.execution_id})
