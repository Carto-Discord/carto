import fetch from "node-fetch";
import { receiver } from ".";

jest.mock("node-fetch");

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Receiver", () => {
  jest.spyOn(console, "warn").mockImplementation(jest.fn());

  describe("given no applicationId is sent", () => {
    it("should not call fetch", () => {
      receiver({ message: "message", imageUrl: "image", token: "token" }, {});

      expect(mockFetch).not.toBeCalled();
    });
  });

  describe("given no token is sent", () => {
    it("should not call fetch", () => {
      receiver(
        { message: "message", imageUrl: "image", applicationId: "appId" },
        {}
      );

      expect(mockFetch).not.toBeCalled();
    });
  });

  describe("given no imageUrl is sent", () => {
    it("should call fetch with just content", () => {
      receiver(
        {
          message: Buffer.from("message").toString("base64"),
          applicationId: Buffer.from("appId").toString("base64"),
          token: Buffer.from("token").toString("base64"),
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
      receiver(
        {
          message: Buffer.from("message").toString("base64"),
          imageUrl: Buffer.from("url").toString("base64"),
          applicationId: Buffer.from("appId").toString("base64"),
          token: Buffer.from("token").toString("base64"),
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
            image: {
              url: "url",
            },
          }),
        }
      );
    });
  });
});
