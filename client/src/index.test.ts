describe("Bot", () => {
  const mockClient = {
    once: jest.fn(),
    on: jest.fn(),
    login: jest.fn(),
  };

  jest.spyOn(console, "log").mockImplementation(() => {});

  const mockCreateMap = jest.fn();
  const mockGetMap = jest.fn();
  const mockDeleteChannel = jest.fn();
  const mockAddToken = jest.fn();
  const mockMoveToken = jest.fn();
  const mockDeleteToken = jest.fn();

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
    jest.mock("./delete", () => ({
      deleteChannel: mockDeleteChannel,
    }));
    jest.mock("./token", () => ({
      addToken: mockAddToken,
      moveToken: mockMoveToken,
      deleteToken: mockDeleteToken,
    }));

    process.env.BOT_TOKEN = "bot token";

    require(".");
  });

  it("should login and setup client", () => {
    expect(mockClient.once).toBeCalledWith("ready", expect.any(Function));
    expect(mockClient.on).toBeCalledWith("message", expect.any(Function));
    expect(mockClient.on).toBeCalledWith("channelDelete", expect.any(Function));
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
          "Create usage: `!create <url> <rows> <columns>`"
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
      describe("given the map creation is unsuccessful", () => {
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

      describe("given the map creation is successful", () => {
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

  describe('given a message "!token add" is received', () => {
    describe("given no parameters are provided", () => {
      it("should send a help message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!token add",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith(
          "Add token usage: `!token add <name> <row> <column> <colour> <size>`"
        );
        expect(mockAddToken).not.toBeCalled();
      });
    });

    describe("given the row isn't a number", () => {
      it("should send an error message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!token add name row col",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith("Row must be a number");
        expect(mockAddToken).not.toBeCalled();
      });
    });

    describe("given all parameters are valid", () => {
      describe("given the token addition is unsuccessful", () => {
        it("should respond with the API message", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
            },
            content: "!token add name 1 A",
            channel: {
              send: jest.fn(),
              id: "4567",
            },
          };

          mockAddToken.mockResolvedValue({
            success: false,
            body: "error message",
          });
          await onMessage(mockMessage);

          expect(mockAddToken).toBeCalledWith({
            name: "name",
            row: 1,
            column: "A",
            channelId: "4567",
          });
          expect(mockMessage.channel.send).toBeCalledWith("error message");
        });
      });

      describe("given the token addition is successful", () => {
        it("should respond with the downloaded image", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
              toString: () => "@user#1234",
            },
            content: "!token add name 1 A red small",
            channel: {
              send: jest.fn(),
              id: "4567",
            },
          };

          mockAddToken.mockResolvedValue({
            success: true,
            body: "filename",
          });
          await onMessage(mockMessage);

          expect(mockAddToken).toBeCalledWith({
            name: "name",
            row: 1,
            column: "A",
            size: "SMALL",
            colour: "red",
            channelId: "4567",
          });
          expect(mockMessage.channel.send).toBeCalledWith(
            "Token name added by @user#1234",
            {
              files: ["filename"],
            }
          );
        });
      });
    });
  });

  describe('given a message "!token move" is received', () => {
    describe("given no parameters are provided", () => {
      it("should send a help message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!token move",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith(
          "Move token usage: `!token move <name> <row> <column>`"
        );
        expect(mockMoveToken).not.toBeCalled();
      });
    });

    describe("given the row isn't a number", () => {
      it("should send an error message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!token move name row col",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith("Row must be a number");
        expect(mockMoveToken).not.toBeCalled();
      });
    });

    describe("given all parameters are valid", () => {
      describe("given the token move is unsuccessful", () => {
        it("should respond with the API message", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
            },
            content: "!token move name 1 A",
            channel: {
              send: jest.fn(),
              id: "4567",
            },
          };

          mockMoveToken.mockResolvedValue({
            success: false,
            body: "error message",
          });
          await onMessage(mockMessage);

          expect(mockMoveToken).toBeCalledWith({
            name: "name",
            row: 1,
            column: "A",
            channelId: "4567",
          });
          expect(mockMessage.channel.send).toBeCalledWith("error message");
        });
      });

      describe("given the token move is successful", () => {
        it("should respond with the downloaded image", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
              toString: () => "@user#1234",
            },
            content: "!token move name 1 A",
            channel: {
              send: jest.fn(),
              id: "4567",
            },
          };

          mockMoveToken.mockResolvedValue({
            success: true,
            body: "filename",
          });
          await onMessage(mockMessage);

          expect(mockMoveToken).toBeCalledWith({
            name: "name",
            row: 1,
            column: "A",
            channelId: "4567",
          });
          expect(mockMessage.channel.send).toBeCalledWith(
            "Token name moved by @user#1234",
            {
              files: ["filename"],
            }
          );
        });
      });
    });
  });

  describe('given a message "!token delete" is received', () => {
    describe("given no parameters are provided", () => {
      it("should send a help message", async () => {
        const onMessage: Function = mockClient.on.mock.calls[0][1];
        const mockMessage = {
          author: {
            id: "1234",
          },
          content: "!token delete",
          channel: {
            send: jest.fn(),
            id: "4567",
          },
        };
        await onMessage(mockMessage);

        expect(mockMessage.channel.send).toBeCalledWith(
          "Delete token usage: `!token delete <name>`"
        );
        expect(mockMoveToken).not.toBeCalled();
      });
    });

    describe("given all parameters are valid", () => {
      describe("given the token deletion is unsuccessful", () => {
        it("should respond with the API message", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
            },
            content: "!token delete name",
            channel: {
              send: jest.fn(),
              id: "4567",
            },
          };

          mockDeleteToken.mockResolvedValue({
            success: false,
            body: "error message",
          });
          await onMessage(mockMessage);

          expect(mockDeleteToken).toBeCalledWith({
            name: "name",
            channelId: "4567",
          });
          expect(mockMessage.channel.send).toBeCalledWith("error message");
        });
      });

      describe("given the token deletion is successful", () => {
        it("should respond with the downloaded image", async () => {
          const onMessage: Function = mockClient.on.mock.calls[0][1];
          const mockMessage = {
            author: {
              id: "1234",
              toString: () => "@user#1234",
            },
            content: "!token delete name",
            channel: {
              send: jest.fn(),
              id: "4567",
            },
          };

          mockDeleteToken.mockResolvedValue({
            success: true,
            body: "filename",
          });
          await onMessage(mockMessage);

          expect(mockDeleteToken).toBeCalledWith({
            name: "name",
            channelId: "4567",
          });
          expect(mockMessage.channel.send).toBeCalledWith(
            "Token name deleted by @user#1234",
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

  describe("given a channelDelete event is recieved", () => {
    it("should call the deleteChannel function", async () => {
      const onChannelDelete: Function = mockClient.on.mock.calls[1][1];
      const mockChannel = {
        id: "1234",
      };

      await onChannelDelete(mockChannel);
      expect(mockDeleteChannel).toBeCalledWith({ channelId: "1234" });
    });
  });
});
