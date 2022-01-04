import {
  APIGatewayClient,
  GetRestApisCommand,
} from "@aws-sdk/client-api-gateway";
import { AWSConfig } from "./common";

export const getLambdaInvokeUrl = async () => {
  const client = new APIGatewayClient(AWSConfig);
  const command = new GetRestApisCommand({});

  const response = await client.send(command);

  const { id } = response.items[0];
  return `http://${id}.execute-api.localhost.localstack.cloud:4566/prod/resource`;
};
