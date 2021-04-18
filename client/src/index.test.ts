describe("Bot", () => {
  const mockClient = {
    once: jest.fn(),
    on: jest.fn(),
    login: jest.fn(),
  };

  jest.spyOn(console, "log").mockImplementation(() => {});

  const mockCreateMap = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.mock("discord.js", () => {
      return {
        Client: jest.fn().mockImplementation(() => {
          return mockClient;
        }),
      };
    });
    jest.mock("express", () => require("jest-express"));
    jest.mock("./create", () => ({
      createMap: mockCreateMap,
    }));

    process.env.BOT_TOKEN = "bot token";

    require(".");
  });

  it("should login and setup client", () => {
    expect(mockClient.once).toBeCalledWith("ready", expect.any(Function));
    expect(mockClient.on).toBeCalledWith("message", expect.any(Function));
    expect(mockClient.login).toBeCalledWith("bot token");
  });

  describe('given a message "!ping" is received', () => {
    it("should respond with pong", async () => {
      const onMessage: Function = mockClient.on.mock.calls[0][1];
      const mockMessage = {
        content: "!ping",
        channel: {
          send: jest.fn(),
        },
      };
      await onMessage(mockMessage);

      expect(mockMessage.channel.send).toBeCalledWith("pong");
    });
  });

  describe('given a message "!create" is received', () => {
    describe("given no parameters are provided", () => {
      it("should send a help message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!create",
          channel: {
            send: jest.fn(),
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith(
          "Create usage: !create <url> <rows> <columns>"
        );
        expect(mockCreateMap).not.toBeCalled();
      });
    });

    describe("given the rows and columns aren't numbers", () => {
      it("should send an error message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!create url rows cols",
          channel: {
            send: jest.fn(),
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith(
          "Rows and Columns must be numbers"
        );
        expect(mockCreateMap).not.toBeCalled();
      });
    });

    describe("given all parameters are valid", () => {
      describe("gvien the map creation is unsuccessful", () => {
        it("should respond with the API message", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
            },
            content: "!create url 1 2",
            channel: {
              send: jest.fn(),
            },
          };

          mockCreateMap.mockResolvedValue({
            success: false,
            body: "error message",
          });
          await onMessage(mockMessage);

          expect(mockMessage.channel.send).toBeCalledWith("error message");
        });
      });

      describe("gvien the map creation is successful", () => {
        it("should respond with the downloaded", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
              toString: () => "@user#1234",
            },
            content: "!create url 1 2",
            channel: {
              send: jest.fn(),
            },
          };

          mockCreateMap.mockResolvedValue({
            success: true,
            body: "filename",
          });
          await onMessage(mockMessage);

          expect(mockMessage.channel.send).toBeCalledWith(
            "Map created for @user#1234",
            {
              files: ["filename"],
            }
          );
        });
      });
    });
  });
});
