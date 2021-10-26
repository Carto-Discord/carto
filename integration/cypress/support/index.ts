/// <reference types="cypress" />

import {
  APIGatewayClient,
  APIGatewayClientConfig,
  GetRestApisCommand,
} from "@aws-sdk/client-api-gateway";
import nacl from "tweetnacl";

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

export const generateSignature = (body: string, timestamp: string) => {
  const secretKey = Buffer.from(Cypress.env("PRIVATE_KEY"), "hex");
  const messageBuffer = Buffer.from(timestamp + body);
  return Buffer.from(
    nacl.sign(messageBuffer, secretKey).slice(0, nacl.sign.signatureLength)
  ).toString("hex");
};
