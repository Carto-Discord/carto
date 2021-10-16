import { APIGatewayProxyEvent } from "aws-lambda";
import { InteractionResponseType, InteractionType } from "slash-commands";
import { createMap } from "./create";
import { getMap } from "./get";
import { addToken, deleteToken, moveToken } from "./token";
import { deleteChannel } from "./delete";
import { validateRequest } from "./validation";
import { slashFunction } from ".";

jest.mock("./create");
jest.mock("./get");
jest.mock("./delete");
jest.mock("./token");
jest.mock("./validation");

const mockCreateMap = createMap as jest.MockedFunction<typeof createMap>;
const mockGetMap = getMap as jest.MockedFunction<typeof getMap>;
const mockDeleteChannel = deleteChannel as jest.MockedFunction<
  typeof deleteChannel
>;
const mockAddToken = addToken as jest.MockedFunction<typeof addToken>;
const mockDeleteToken = deleteToken as jest.MockedFunction<typeof deleteToken>;
const mockMoveToken = moveToken as jest.MockedFunction<typeof moveToken>;
const mockValidateAPIGatewayProxyEvent = validateRequest as jest.MockedFunction<
  typeof validateRequest
>;

jest.spyOn(console, "log").mockImplementation(jest.fn());

describe("Slash Function", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.BOT_TOKEN = "bot token";
  });

  describe("given the APIGatewayProxyEvent cannot be validated", () => {
    beforeEach(() => {
      mockValidateAPIGatewayProxyEvent.mockReturnValue(false);
    });

    it("should return a 401 response", async () => {
      const response = await slashFunction({
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

    describe("given a httpMethod type other than POST is sent", () => {
      it("should return a 405 response", async () => {
        const response = await slashFunction({
          body: JSON.stringify({ type: InteractionType.PING }),
          httpMethod: "GET",
        } as APIGatewayProxyEvent);

        expect(response.statusCode).toBe(405);
      });
    });

    describe("given a body type of PING is sent", () => {
      it("should return a 200 response with a type of PONG", async () => {
        const response = await slashFunction({
          body: JSON.stringify({ type: InteractionType.PING }),
          httpMethod: "POST",
        } as APIGatewayProxyEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(
          JSON.stringify({ type: InteractionResponseType.PONG })
        );
      });
    });

    describe("given an unknown command is recieved", () => {
      it("should end without doing anything", async () => {
        const response = await slashFunction({
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

        expect(mockAddToken).not.toBeCalled();
        expect(mockDeleteToken).not.toBeCalled();
        expect(mockMoveToken).not.toBeCalled();
        expect(mockCreateMap).not.toBeCalled();
        expect(mockGetMap).not.toBeCalled();

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(
          JSON.stringify({
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          })
        );
      });
    });

    describe("given a map command is received", () => {
      describe("given a create subcommand is received", () => {
        it("should send a message back to the channel", async () => {
          const response = await slashFunction({
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

          expect(mockCreateMap).toBeCalledWith({
            applicationId: "1234",
            channelId: "mockChannel",
            columns: 5,
            rows: 3,
            url: "some.url",
            token: "mockToken",
          });
          expect(response.body).toBe(
            JSON.stringify({
              type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            })
          );
        });
      });

      describe("given a get subcommand is received", () => {
        it("should call getMap", async () => {
          await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              application_id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
              data: {
                name: "map",
                options: [
                  {
                    name: "get",
                    options: [],
                  },
                ],
              },
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockGetMap).toBeCalledWith({
            channelId: "mockChannel",
            applicationId: "1234",
            token: "mockToken",
          });
        });
      });

      describe("given a delete subcommand is received", () => {
        it("should call deleteChannel", async () => {
          await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              application_id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
              data: {
                name: "map",
                options: [
                  {
                    name: "delete",
                    options: [],
                  },
                ],
              },
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockDeleteChannel).toBeCalledWith({
            channelId: "mockChannel",
            applicationId: "1234",
            token: "mockToken",
          });
        });
      });

      describe("given an unknown subcommand is received", () => {
        it("should do nothing", async () => {
          await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              application_id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
              data: {
                name: "map",
                options: [
                  {
                    name: "unknown",
                    options: [],
                  },
                ],
              },
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockAddToken).not.toBeCalled();
          expect(mockDeleteToken).not.toBeCalled();
          expect(mockMoveToken).not.toBeCalled();
          expect(mockCreateMap).not.toBeCalled();
          expect(mockGetMap).not.toBeCalled();
        });
      });
    });

    describe("given a token command is received", () => {
      describe("given an add subcommand is received", () => {
        it("should send a message back to the channel", async () => {
          const response = await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              data: {
                name: "token",
                options: [
                  {
                    name: "add",
                    options: [
                      {
                        name: "name",
                        value: "token name",
                      },
                      {
                        name: "row",
                        value: 3,
                      },
                      {
                        name: "column",
                        value: "AA",
                      },
                      {
                        name: "colour",
                        value: "red",
                      },
                    ],
                  },
                ],
              },
              application_id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockAddToken).toBeCalledWith({
            applicationId: "1234",
            channelId: "mockChannel",
            colour: "red",
            column: "AA",
            name: "token name",
            row: 3,
            token: "mockToken",
          });
          expect(response.body).toBe(
            JSON.stringify({
              type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            })
          );
        });
      });

      describe("given an move subcommand is received", () => {
        it("should send a message back to the channel", async () => {
          const response = await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              data: {
                name: "token",
                options: [
                  {
                    name: "move",
                    options: [
                      {
                        name: "name",
                        value: "token name",
                      },
                      {
                        name: "row",
                        value: 3,
                      },
                      {
                        name: "column",
                        value: "AA",
                      },
                    ],
                  },
                ],
              },
              application_id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockMoveToken).toBeCalledWith({
            applicationId: "1234",
            channelId: "mockChannel",
            column: "AA",
            name: "token name",
            row: 3,
            token: "mockToken",
          });
          expect(response.body).toBe(
            JSON.stringify({
              type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            })
          );
        });
      });

      describe("given an delete subcommand is received", () => {
        it("should send a message back to the channel", async () => {
          const response = await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              application_id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
              data: {
                name: "token",
                options: [
                  {
                    name: "delete",
                    options: [
                      {
                        name: "name",
                        value: "token name",
                      },
                    ],
                  },
                ],
              },
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockDeleteToken).toBeCalledWith({
            applicationId: "1234",
            channelId: "mockChannel",
            name: "token name",
            token: "mockToken",
          });
          expect(response.body).toBe(
            JSON.stringify({
              type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            })
          );
        });
      });

      describe("given an unknown subcommand is received", () => {
        it("should do nothing", async () => {
          await slashFunction({
            body: JSON.stringify({
              type: InteractionType.APPLICATION_COMMAND,
              id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
              data: {
                name: "token",
                options: [
                  {
                    name: "unknown",
                    options: [],
                  },
                ],
              },
            }),
            httpMethod: "POST",
          } as APIGatewayProxyEvent);

          expect(mockAddToken).not.toBeCalled();
          expect(mockDeleteToken).not.toBeCalled();
          expect(mockMoveToken).not.toBeCalled();
          expect(mockCreateMap).not.toBeCalled();
          expect(mockGetMap).not.toBeCalled();
        });
      });
    });
  });
});
