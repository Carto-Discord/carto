import fetch from "node-fetch";
import { getCurrentMap } from "./firestore";
import { receiver } from "./receiver";

jest.mock("node-fetch");
jest.mock("./firestore");

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockGetCurrentMap = getCurrentMap as jest.MockedFunction<
  typeof getCurrentMap
>;

describe("Receiver", () => {
  const mockResponse = {
    status: jest.fn().mockReturnValue({ end: jest.fn() }),
  };

  jest.spyOn(console, "log").mockImplementation(jest.fn());
  jest.spyOn(console, "warn").mockImplementation(jest.fn());

  describe("given no applicationId is sent", () => {
    it("should not call fetch", () => {
      const data = { message: "message", imageUrl: "image", token: "token" };

      //@ts-ignore
      receiver({ body: data }, mockResponse);

      expect(mockFetch).not.toBeCalled();
    });
  });

  describe("given no token is sent", () => {
    it("should not call fetch", () => {
      const data = {
        message: "message",
        imageUrl: "image",
        applicationId: "appId",
      };

      //@ts-ignore
      receiver({ body: data }, mockResponse);

      expect(mockFetch).not.toBeCalled();
    });
  });

  describe("given an action of get_map is received", () => {
    describe("given a map is not found", () => {
      beforeEach(() => {
        mockGetCurrentMap.mockResolvedValue(undefined);
      });

      it("should send an appropriate embed", async () => {
        const data = {
          action: "get_map",
          message: "channel",
          applicationId: "appId",
          token: "token",
        };

        //@ts-ignore
        await receiver({ body: data }, mockResponse);

        expect(mockFetch).toBeCalledWith(
          "https://discord.com/api/v9/webhooks/appId/token/messages/@original",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embeds: [
                { type: "rich", description: "No map found for this channel" },
              ],
            }),
          }
        );
      });
    });

    describe("given a map is found", () => {
      beforeEach(() => {
        mockGetCurrentMap.mockResolvedValue({
          publicUrl: "url",
          tokens: [
            { name: "token1", row: 1, column: "A", colour: "red", size: 1 },
          ],
        });
      });

      it("should send an appropriate embed", async () => {
        const data = {
          action: "get_map",
          message: "channel",
          applicationId: "appId",
          token: "token",
        };

        //@ts-ignore
        await receiver({ body: data }, mockResponse);

        expect(mockFetch).toBeCalledWith(
          "https://discord.com/api/v9/webhooks/appId/token/messages/@original",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embeds: [
                {
                  type: "rich",
                  title: "Map retrieved",
                  image: {
                    url: "url",
                  },
                  fields: [
                    {
                      name: "token1",
                      value: "A1",
                      inline: true,
                    },
                  ],
                },
              ],
            }),
          }
        );
      });
    });
  });

  describe("given no imageUrl is sent", () => {
    it("should call fetch with just content", () => {
      const data = {
        message: "message",
        applicationId: "appId",
        token: "token",
      };

      //@ts-ignore
      receiver({ body: data }, mockResponse);

      expect(mockFetch).toBeCalledWith(
        "https://discord.com/api/v9/webhooks/appId/token/messages/@original",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [{ type: "rich", description: "message" }],
          }),
        }
      );
    });
  });

  describe("given all values are sent", () => {
    it("should call fetch with just content", () => {
      const data = {
        message: "message",
        applicationId: "appId",
        token: "token",
        imageUrl: "url",
      };

      //@ts-ignore
      receiver({ body: data }, mockResponse);

      expect(mockFetch).toBeCalledWith(
        "https://discord.com/api/v9/webhooks/appId/token/messages/@original",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                type: "rich",
                description: "message",
                image: {
                  url: "url",
                },
              },
            ],
          }),
        }
      );
    });
  });
});
