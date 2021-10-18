import mockAxios from "jest-mock-axios";
import { addToken, deleteToken, moveToken } from "./token";

describe("Token", () => {
  beforeEach(() => {
    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe("Add Token", () => {
    describe("given size is not provided", () => {
      it("should call axios with the appropriate request", async () => {
        await addToken({
          applicationId: "appId",
          channelId: "1234",
          colour: "red",
          column: "A",
          name: "token",
          row: 1,
          token: "mockToken",
        });

        expect(mockAxios.post).toBeCalledWith(
          "https://trigger.url/token/1234",
          {
            applicationId: "appId",
            colour: "red",
            column: "A",
            name: "token",
            row: 1,
            size: "MEDIUM",
            token: "mockToken",
          }
        );
      });
    });

    describe("given size is provided", () => {
      it("should call axios with the appropriate request", async () => {
        await addToken({
          applicationId: "appId",
          channelId: "1234",
          column: "A",
          name: "token",
          row: 1,
          size: "TINY",
          token: "mockToken",
        });

        expect(mockAxios.post).toBeCalledWith(
          "https://trigger.url/token/1234",
          {
            applicationId: "appId",
            column: "A",
            name: "token",
            row: 1,
            size: "TINY",
            token: "mockToken",
          }
        );
      });
    });
  });

  describe("Move Token", () => {
    it("should call axios with the appropriate request", async () => {
      await moveToken({
        applicationId: "appId",
        channelId: "1234",
        column: "A",
        name: "token",
        row: 1,
        token: "mockToken",
      });

      expect(mockAxios.put).toBeCalledWith("https://trigger.url/token/1234", {
        applicationId: "appId",
        column: "A",
        name: "token",
        row: 1,
        token: "mockToken",
      });
    });
  });

  describe("Delete Token", () => {
    it("should call axios with the appropriate request", async () => {
      await deleteToken({
        applicationId: "appId",
        channelId: "1234",
        name: "token",
        token: "mockToken",
      });

      expect(mockAxios.delete).toBeCalledWith(
        "https://trigger.url/token/1234",
        {
          data: {
            applicationId: "appId",
            name: "token",
            token: "mockToken",
          },
        }
      );
    });
  });
});
