describe("Bot", () => {
  const mockClient = {
    once: jest.fn(),
    on: jest.fn(),
    login: jest.fn(),
  };

  jest.spyOn(console, "log").mockImplementation(() => {});

  const mockCreateMap = jest.fn();
  const mockGetMap = jest.fn();

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
    jest.mock("./get", () => ({
      getMap: mockGetMap,
    }));

    process.env.BOT_TOKEN = "bot token";

    require(".");
  });

  it("should login and setup client", () => {
    expect(mockClient.once).toBeCalledWith("ready", expect.any(Function));
    expect(mockClient.on).toBeCalledWith("message", expect.any(Function));
    expect(mockClient.login).toBeCalledWith("bot token");
  });

  describe('given a message "!help" is received', () => {
    it("should respond to the channel and in DMs", async () => {
      const onMessage: Function = mockClient.on.mock.calls[0][1];
      const mockMessage = {
        content: "!help",
        author: {
          createDM: jest.fn(),
        },
        channel: {
          send: jest.fn(),
        },
      };
      const mockDMSend = jest.fn();
      mockMessage.author.createDM.mockResolvedValue({ send: mockDMSend });
      await onMessage(mockMessage);

      expect(mockMessage.channel.send).toBeCalledWith(
        "Help instructions have been sent to your DMs"
      );
      expect(mockDMSend).toBeCalled();
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
            id: "4567",
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
            id: "4567",
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
              id: "4567",
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
              id: "4567",
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

  describe('given a message "!map" is received', () => {
    describe("gvien the map get is unsuccessful", () => {
      it("should respond with the API message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!map",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };

        mockGetMap.mockResolvedValue({
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
          },
          content: "!map",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };

        mockGetMap.mockResolvedValue({
          success: true,
          body: "filename",
        });
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith("Map retrieved", {
          files: ["filename"],
        });
      });
    });
  });
});
