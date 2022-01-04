import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";

type Event = {
  application_id: string;
  channel_id: string;
  token: string;
};

const ERROR_TITLE = "Deletion error";
const SUCCESS_TITLE = "Channel data deleted";

export const handler = async ({
  application_id,
  channel_id,
  token,
}: Event): Promise<APIGatewayProxyResult> => {
  // Local testing only, ignored in production
  const { LOCALSTACK_HOSTNAME } = process.env;
  const endpoint = LOCALSTACK_HOSTNAME ? `http://localhost:4566` : undefined;

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });
  const command = new DeleteItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channel_id } },
  });

  return client
    .send(command)
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({
        application_id,
        token,
        embed: {
          title: SUCCESS_TITLE,
          description:
            "All related maps will be erased from Carto within 24 hours",
          type: "rich",
        },
      }),
    }))
    .catch((e) => {
      console.warn(e);
      return {
        statusCode: 404,
        body: JSON.stringify({
          application_id,
          token,
          embed: {
            title: ERROR_TITLE,
            description:
              "Data couldn't be deleted, likely because it never existed",
            type: "rich",
          },
        }),
      };
    });
};
