import {
  LambdaClient,
  LambdaClientConfig,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";

const config: LambdaClientConfig = { region: "us-east-1" };

Cypress.Commands.add("invokeClient", async (Payload: Uint8Array) => {
  const client = new LambdaClient(config);
  const command = new GetFunctionCommand({
    FunctionName: "carto-bot-client",
  });

  const response = await client.send(command);
});
