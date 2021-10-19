/// <reference types="cypress" />

import {
  APIGatewayClient,
  APIGatewayClientConfig,
  GetRestApisCommand,
} from "@aws-sdk/client-api-gateway";

const config: APIGatewayClientConfig = {
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
};

export const getLambdaInvokeUrl = async () => {
  const client = new APIGatewayClient(config);
  const command = new GetRestApisCommand({});

  const response = await client.send(command);

  const { id } = response.items[0];
  return `http://${id}.execute-api.localhost.localstack.cloud:4566/prod/resource`;
};
