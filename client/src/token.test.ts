import fetch from "node-fetch";
import { addToken, deleteToken, moveToken } from "./token";

jest.mock("node-fetch");

describe("Token", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  describe("Add Token", () => {
    describe("given size is not provided", () => {
      it("should call fetch with the appropriate request", async () => {
        await addToken({
          applicationId: "appId",
          channelId: "1234",
          colour: "red",
          column: "A",
          name: "token",
          row: 1,
          token: "mockToken",
        });

        expect(fetch).toBeCalledWith("https://trigger.url/token/1234", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId: "appId",
            colour: "red",
            column: "A",
            name: "token",
            row: 1,
            size: "MEDIUM",
            token: "mockToken",
          }),
        });
      });
    });

    describe("given size is provided", () => {
      it("should call fetch with the appropriate request", async () => {
        await addToken({
          applicationId: "appId",
          channelId: "1234",
          column: "A",
          name: "token",
          row: 1,
          size: "TINY",
          token: "mockToken",
        });

        expect(fetch).toBeCalledWith("https://trigger.url/token/1234", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId: "appId",
            column: "A",
            name: "token",
            row: 1,
            size: "TINY",
            token: "mockToken",
          }),
        });
      });
    });
  });

  describe("Move Token", () => {
    it("should call fetch with the appropriate request", async () => {
      await moveToken({
        applicationId: "appId",
        channelId: "1234",
        column: "A",
        name: "token",
        row: 1,
        token: "mockToken",
      });

      expect(fetch).toBeCalledWith("https://trigger.url/token/1234", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: "appId",
          column: "A",
          name: "token",
          row: 1,
          token: "mockToken",
        }),
      });
    });
  });

  describe("Delete Token", () => {
    it("should call fetch with the appropriate request", async () => {
      await deleteToken({
        applicationId: "appId",
        channelId: "1234",
        name: "token",
        token: "mockToken",
      });

      expect(fetch).toBeCalledWith("https://trigger.url/token/1234", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: "appId",
          name: "token",
          token: "mockToken",
        }),
      });
    });
  });
});
