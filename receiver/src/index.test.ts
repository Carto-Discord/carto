import fetch from "node-fetch";
import { receiver } from ".";

jest.mock("node-fetch");

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Receiver", () => {
  jest.spyOn(console, "log").mockImplementation(jest.fn());
  jest.spyOn(console, "warn").mockImplementation(jest.fn());

  describe("given no applicationId is sent", () => {
    it("should not call fetch", () => {
      const data = { message: "message", imageUrl: "image", token: "token" };

      receiver(
        { data: Buffer.from(JSON.stringify(data)).toString("base64") },
        {}
      );

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

      receiver(
        {
          data: Buffer.from(JSON.stringify(data)).toString("base64"),
        },
        {}
      );

      expect(mockFetch).not.toBeCalled();
    });
  });

  describe("given no imageUrl is sent", () => {
    it("should call fetch with just content", () => {
      const data = {
        message: "message",
        applicationId: "appId",
        token: "token",
      };

      receiver(
        {
          data: Buffer.from(JSON.stringify(data)).toString("base64"),
        },
        {}
      );

      expect(mockFetch).toBeCalledWith(
        "https://discord.com/api/v9/webhooks/appId/token/messages/@original",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: "message",
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

      receiver(
        {
          data: Buffer.from(JSON.stringify(data)).toString("base64"),
        },
        {}
      );

      expect(mockFetch).toBeCalledWith(
        "https://discord.com/api/v9/webhooks/appId/token/messages/@original",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: "message",
            embeds: [
              {
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
