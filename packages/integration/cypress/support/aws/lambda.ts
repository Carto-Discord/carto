import {
  LambdaClient,
  GetFunctionUrlConfigCommand,
} from "@aws-sdk/client-lambda";
import { AWSConfig } from "./common";

const getLambdaFunctionUrl = async (FunctionName: string) => {
  const lambdaClient = new LambdaClient(AWSConfig);
  const getFunctionUrl = new GetFunctionUrlConfigCommand({
    FunctionName,
  });

  const response = await lambdaClient.send(getFunctionUrl);

  return response.FunctionUrl;
};

export const getLambdaInvokeUrl = () =>
  getLambdaFunctionUrl("carto-bot-parse-command");
export const getJanitorInvokeUrl = () =>
  getLambdaFunctionUrl("carto-bot-janitor");
