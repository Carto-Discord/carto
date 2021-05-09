import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";
import { addToken, deleteToken, moveToken } from "./token";

jest.mock("./authentication");
jest.mock("./requestHandler");

const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.MockedFunction<
  typeof createAuthenticatedClient
>;
const mockHandleRequest = handleRequest as jest.MockedFunction<
  typeof handleRequest
>;

describe("Token", () => {
  const mockRequest = jest.fn();

  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    //@ts-ignore
    mockCreateAuthenticatedClient.mockResolvedValue({ request: mockRequest });

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("Add Token", () => {
    describe("given size is not provided", () => {
      it("should call handleRequest with the appropriate request", async () => {
        await addToken({
          applicationId: "appId",
          channelId: "1234",
          colour: "red",
          column: "A",
          name: "token",
          row: 1,
          token: "mockToken",
        });

        expect(mockHandleRequest).toBeCalledTimes(1);
        await mockHandleRequest.mock.calls[0][0]();

        expect(mockRequest).toBeCalledWith({
          url: "https://trigger.url",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            action: "addToken",
            applicationId: "appId",
            channelId: "1234",
            colour: "red",
            column: "A",
            name: "token",
            row: 1,
            size: "MEDIUM",
            token: "mockToken",
          },
        });
      });
    });

    describe("given size is provided", () => {
      it("should call handleRequest with the appropriate request", async () => {
        await addToken({
          applicationId: "appId",
          channelId: "1234",
          column: "A",
          name: "token",
          row: 1,
          size: "TINY",
          token: "mockToken",
        });

        expect(mockHandleRequest).toBeCalledTimes(1);
        await mockHandleRequest.mock.calls[0][0]();

        expect(mockRequest).toBeCalledWith({
          url: "https://trigger.url",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            action: "addToken",
            applicationId: "appId",
            channelId: "1234",
            column: "A",
            name: "token",
            row: 1,
            size: "TINY",
            token: "mockToken",
          },
        });
      });
    });
  });

  describe("Move Token", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await moveToken({
        applicationId: "appId",
        channelId: "1234",
        column: "A",
        name: "token",
        row: 1,
        token: "mockToken",
      });

      expect(mockHandleRequest).toBeCalledTimes(1);
      await mockHandleRequest.mock.calls[0][0]();

      expect(mockRequest).toBeCalledWith({
        url: "https://trigger.url",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          action: "moveToken",
          applicationId: "appId",
          channelId: "1234",
          column: "A",
          name: "token",
          row: 1,
          token: "mockToken",
        },
      });
    });
  });

  describe("Delete Token", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await deleteToken({
        applicationId: "appId",
        channelId: "1234",
        name: "token",
        token: "mockToken",
      });

      expect(mockHandleRequest).toBeCalledTimes(1);
      await mockHandleRequest.mock.calls[0][0]();

      expect(mockRequest).toBeCalledWith({
        url: "https://trigger.url",
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          action: "deleteToken",
          applicationId: "appId",
          channelId: "1234",
          name: "token",
          token: "mockToken",
        },
      });
    });
  });
});
