import { Request, Response } from "express";
import { createMap } from "./create";
import { getMap } from "./get";
import { addToken, deleteToken, moveToken } from "./token";
import { validateRequest } from "./validation";
import { slashFunction } from ".";
import { InteractionResponseType, InteractionType } from "slash-commands";

jest.mock("./create");
jest.mock("./get");
jest.mock("./delete");
jest.mock("./token");
jest.mock("./validation");

const mockCreateMap = createMap as jest.MockedFunction<typeof createMap>;
const mockGetMap = getMap as jest.MockedFunction<typeof getMap>;
const mockAddToken = addToken as jest.MockedFunction<typeof addToken>;
const mockDeleteToken = deleteToken as jest.MockedFunction<typeof deleteToken>;
const mockMoveToken = moveToken as jest.MockedFunction<typeof moveToken>;
const mockValidateRequest = validateRequest as jest.MockedFunction<
  typeof validateRequest
>;

describe("Slash Function", () => {
  const mockEnd = jest.fn();
  const mockJson = jest.fn().mockReturnValue({ end: mockEnd });
  const mockResponse = ({
    status: jest.fn().mockReturnValue({ end: mockEnd, json: mockJson }),
  } as unknown) as Response;
  const mockEmbed = {
    title: null,
    type: "rich",
    description: null,
    url: null,
    timestamp: null,
    color: null,
    fields: [],
    thumbnail: null,
    image: null,
    author: null,
    footer: null,
  };

  jest.spyOn(console, "log").mockImplementation(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.BOT_TOKEN = "bot token";
  });

  describe("given the request cannot be validated", () => {
    beforeEach(() => {
      mockValidateRequest.mockReturnValue(false);
    });

    it("should return a 401 response", async () => {
      await slashFunction({} as Request, mockResponse);

      expect(mockResponse.status).toBeCalledWith(401);
      expect(mockEnd).toBeCalledWith("invalid request signature");
      expect(mockResponse.status).not.toBeCalledWith(200);
    });
  });

  describe("given the request is valid", () => {
    beforeEach(() => {
      mockValidateRequest.mockReturnValue(true);
    });

    describe("given a method type other than POST is sent", () => {
      it("should return a 405 response", async () => {
        await slashFunction(
          { body: { type: InteractionType.PING }, method: "GET" } as Request,
          mockResponse
        );

        expect(mockResponse.status).toBeCalledWith(405);
        expect(mockResponse.status).not.toBeCalledWith(200);
      });
    });

    describe("given a body type of PING is sent", () => {
      it("should return a 200 response with a type of PONG", async () => {
        await slashFunction(
          { body: { type: InteractionType.PING }, method: "POST" } as Request,
          mockResponse
        );

        expect(mockResponse.status).toBeCalledWith(200);
        expect(mockJson).toBeCalledWith({ type: InteractionResponseType.PONG });
        expect(mockJson).not.toBeCalledWith({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        });
      });
    });

    describe("given an unknown command is recieved", () => {
      it("should end without doing anything", async () => {
        await slashFunction(
          {
            body: {
              type: InteractionType.APPLICATION_COMMAND,
              id: "1234",
              token: "mockToken",
              channel_id: "mockChannel",
              data: {
                name: "unknown",
                options: [],
              },
            },
            method: "POST",
          } as Request,
          mockResponse
        );

        expect(mockJson).not.toBeCalled();
      });
    });

    describe("given a map command is received", () => {
      describe("given a create subcommand is received", () => {
        describe("given the create response fails", () => {
          beforeEach(() => {
            mockCreateMap.mockResolvedValue({
              success: false,
              body: "error",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "error" },
            });
          });
        });

        describe("given the create response succeeds", () => {
          beforeEach(() => {
            mockCreateMap.mockResolvedValue({
              success: true,
              body: "file",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockCreateMap).toBeCalledWith({
              url: "some.url",
              rows: 3,
              columns: 5,
              channelId: "mockChannel",
            });
            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [
                  {
                    ...mockEmbed,
                    title: "Map created",
                    image: { url: "file" },
                  },
                ],
              },
            });
          });
        });
      });

      describe("given a get subcommand is received", () => {
        describe("given the get response fails", () => {
          beforeEach(() => {
            mockGetMap.mockResolvedValue({
              success: false,
              body: "error",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "error" },
            });
          });
        });

        describe("given the get response succeeds", () => {
          beforeEach(() => {
            mockGetMap.mockResolvedValue({
              success: true,
              body: "file",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockGetMap).toBeCalledWith({
              channelId: "mockChannel",
            });
            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [
                  {
                    ...mockEmbed,
                    title: "Map retrieved",
                    image: { url: "file" },
                  },
                ],
              },
            });
          });
        });
      });

      describe("given an unknown subcommand is received", () => {
        it("should do nothing", async () => {
          await slashFunction(
            {
              body: {
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
              },
              method: "POST",
            } as Request,
            mockResponse
          );

          expect(mockJson).not.toBeCalled();
        });
      });
    });

    describe("given a token command is received", () => {
      describe("given an add subcommand is received", () => {
        describe("given the add response fails", () => {
          beforeEach(() => {
            mockAddToken.mockResolvedValue({
              success: false,
              body: "error",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
                  type: InteractionType.APPLICATION_COMMAND,
                  application_id: "1234",
                  token: "mockToken",
                  channel_id: "mockChannel",
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "error" },
            });
          });
        });

        describe("given the add response succeeds", () => {
          beforeEach(() => {
            mockAddToken.mockResolvedValue({
              success: true,
              body: "file",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockAddToken).toBeCalledWith({
              name: "token name",
              row: 3,
              column: "AA",
              colour: "red",
              channelId: "mockChannel",
            });
            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [
                  {
                    ...mockEmbed,
                    title: "Token token name added to AA3",
                    image: { url: "file" },
                  },
                ],
              },
            });
          });
        });
      });

      describe("given an move subcommand is received", () => {
        describe("given the move response fails", () => {
          beforeEach(() => {
            mockMoveToken.mockResolvedValue({
              success: false,
              body: "error",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
                  type: InteractionType.APPLICATION_COMMAND,
                  application_id: "1234",
                  token: "mockToken",
                  channel_id: "mockChannel",
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "error" },
            });
          });
        });

        describe("given the move response succeeds", () => {
          beforeEach(() => {
            mockMoveToken.mockResolvedValue({
              success: true,
              body: "file",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockMoveToken).toBeCalledWith({
              name: "token name",
              row: 3,
              column: "AA",
              channelId: "mockChannel",
            });
            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [
                  {
                    ...mockEmbed,
                    title: "Token token name moved to AA3",
                    image: { url: "file" },
                  },
                ],
              },
            });
          });
        });
      });

      describe("given an delete subcommand is received", () => {
        describe("given the delete response fails", () => {
          beforeEach(() => {
            mockDeleteToken.mockResolvedValue({
              success: false,
              body: "error",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: "error" },
            });
          });
        });

        describe("given the delete response succeeds", () => {
          beforeEach(() => {
            mockDeleteToken.mockResolvedValue({
              success: true,
              body: "file",
            });
          });

          it("should send a message back to the channel", async () => {
            await slashFunction(
              {
                body: {
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
                },
                method: "POST",
              } as Request,
              mockResponse
            );

            expect(mockDeleteToken).toBeCalledWith({
              name: "token name",
              channelId: "mockChannel",
            });
            expect(mockJson).toBeCalledWith({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [
                  {
                    ...mockEmbed,
                    title: "Token token name deleted",
                    image: { url: "file" },
                  },
                ],
              },
            });
          });
        });
      });

      describe("given an unknown subcommand is received", () => {
        it("should do nothing", async () => {
          await slashFunction(
            {
              body: {
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
              },
              method: "POST",
            } as Request,
            mockResponse
          );

          expect(mockJson).not.toBeCalled();
        });
      });
    });
  });
});
