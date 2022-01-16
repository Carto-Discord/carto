import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { InteractionResponseType, InteractionType } from "slash-commands";

import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

import { validateRequest } from "../src/validation";
import { handler } from "../src/index";

jest.mock("../src/validation");

const mockValidateAPIGatewayProxyEvent = validateRequest as jest.MockedFunction<
  typeof validateRequest
>;
const sfnMock = mockClient(SFNClient);

describe("Handler", () => {
  sfnMock.on(StartExecutionCommand).resolves({ executionArn: "newArn" });

  beforeAll(() => {
    process.env.AWS_REGION = "eu-central-1";
    process.env.STATE_MACHINE_ARN = "mockArn";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given the APIGatewayProxyEvent cannot be validated", () => {
    beforeEach(() => {
      mockValidateAPIGatewayProxyEvent.mockReturnValue(false);
    });

    it("should return a 401 response", async () => {
      const response = await handler({
        httpMethod: "POST",
      } as APIGatewayProxyEvent);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBe("invalid request signature");
    });
  });

  describe("given the APIGatewayProxyEvent is valid", () => {
    beforeEach(() => {
      mockValidateAPIGatewayProxyEvent.mockReturnValue(true);
    });

    describe("given a body type of PING is received", () => {
      it("should return a 200 response with a type of PONG", async () => {
        const response = await handler({
          body: JSON.stringify({ type: InteractionType.PING }),
          httpMethod: "POST",
        } as APIGatewayProxyEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(
          JSON.stringify({ type: InteractionResponseType.PONG })
        );
      });
    });

    describe("given an unknown command is received", () => {
      it("should end without doing anything", async () => {
        const response = await handler({
          body: JSON.stringify({
            type: InteractionType.APPLICATION_COMMAND,
            id: "1234",
            token: "mockToken",
            channel_id: "mockChannel",
            data: {
              name: "unknown",
              options: [],
            },
          }),
          httpMethod: "POST",
        } as APIGatewayProxyEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(
          JSON.stringify({
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          })
        );
      });
    });

    describe("given a command with no options is received", () => {
      it("should return a 400 response", async () => {
        const response = await handler({
          body: JSON.stringify({
            type: InteractionType.APPLICATION_COMMAND,
            id: "1234",
            token: "mockToken",
            channel_id: "mockChannel",
            data: {},
          }),
          httpMethod: "POST",
        } as APIGatewayProxyEvent);

        expect(response.statusCode).toBe(400);
        expect(response.body).toBe("no options provided");
      });
    });

    describe("given a valid command is received", () => {
      it("should send a state machine executuion command", async () => {
        const response = await handler({
          body: JSON.stringify({
            type: InteractionType.APPLICATION_COMMAND,
            application_id: "1234",
            token: "mockToken",
            channel_id: "mockChannel",
            data: {
              name: "map",
              options: [
                {
                  name: "create",
                  options: [
                    {
                      name: "url",
                      value: "some.url",
                    },
                    {
                      name: "rows",
                      value: 3,
                    },
                    {
                      name: "columns",
                      value: 5,
                    },
                  ],
                },
              ],
            },
          }),
          httpMethod: "POST",
        } as APIGatewayProxyEvent);

        expect(response).toEqual({
          statusCode: 200,
          body: '{"type":5}',
        });

        const startArgs = sfnMock.commandCalls(StartExecutionCommand)[0];
        expect(startArgs.args[0].input).toMatchObject({
          input: JSON.stringify({
            channel_id: "mockChannel",
            token: "mockToken",
            application_id: "1234",
            command: "map",
            subCommand: "create",
            url: "some.url",
            rows: 3,
            columns: 5,
          }),
          stateMachineArn: "mockArn",
        });
      });
    });
  });
});
