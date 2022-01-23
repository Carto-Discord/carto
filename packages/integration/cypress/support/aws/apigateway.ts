import {
  APIGatewayClient,
  GetRestApisCommand,
} from "@aws-sdk/client-api-gateway";
import { AWSConfig } from "./common";

const getId = async () => {
  const client = new APIGatewayClient(AWSConfig);
  const command = new GetRestApisCommand({});

  const response = await client.send(command);

  return response.items[0].id;
};

export const getLambdaInvokeUrl = async () => {
  const id = await getId();
  return `http://${id}.execute-api.localhost.localstack.cloud:4566/prod/resource`;
};

export const getJanitorInvokeUrl = async () => {
  const id = await getId();
  return `http://${id}.execute-api.localhost.localstack.cloud:4566/prod/janitor`;
};
