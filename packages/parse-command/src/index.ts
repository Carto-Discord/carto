import {
  ApplicationCommandInteractionDataOption,
  Interaction,
} from "slash-commands";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

import { InteractionResponseType, InteractionType } from "./types";
import { validateRequest } from "./validation";

type DiscordResponse = {
  type: InteractionResponseType;
};

const extractParameters = (
  command: ApplicationCommandInteractionDataOption
) => {
  if ("options" in command) {
    return command.options.reduce((acc, o) => {
      if ("value" in o) acc[o.name] = o.value;
      return acc;
    }, {} as { [key: string]: string | number | boolean });
  }
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2<DiscordResponse>> => {
  const isVerified = validateRequest(event);

  if (!isVerified) {
    return {
      statusCode: 401,
      body: "invalid request signature",
    };
  }

  const body: Interaction = JSON.parse(event?.body || "{}");

  if (body.type === InteractionType.PING) {
    return { type: InteractionResponseType.PONG };
  }

  const commandGroup = body.data;

  if ("channel_id" in body && "options" in commandGroup) {
    const { channel_id, token, application_id } = body;

    if (commandGroup.options?.length) {
      const command = commandGroup.options?.[0];
      const parameters = extractParameters(command);
      const input = {
        channel_id,
        token,
        application_id,
        command: commandGroup.name,
        subCommand: command.name,
        ...parameters,
      };

      // Local testing only, ignored in production
      const { LOCALSTACK_HOSTNAME } = process.env;
      const endpoint = LOCALSTACK_HOSTNAME
        ? `http://localhost:4566`
        : undefined;

      const client = new SFNClient({
        region: process.env.AWS_REGION,
        endpoint,
      });
      const startCommand = new StartExecutionCommand({
        input: JSON.stringify(input),
        stateMachineArn: process.env.STATE_MACHINE_ARN,
      });

      await client.send(startCommand);
    }

    return {
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    };
  }

  return {
    statusCode: 400,
    body: "no options provided",
  };
};
