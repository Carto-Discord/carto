import { createAuthenticatedClient } from "./utils/authentication";
import { handleRequest } from "./utils/requestHandler";
import { addToken, deleteToken, moveToken } from "./token";

jest.mock("./utils/authentication");
jest.mock("./utils/requestHandler");

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
          row: 1,
          column: "A",
          name: "token",
          channelId: "1234",
          colour: "red",
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
            name: "token",
            row: 1,
            column: "A",
            size: "MEDIUM",
            colour: "red",
            channelId: "1234",
          },
        });
      });
    });

    describe("given size is provided", () => {
      it("should call handleRequest with the appropriate request", async () => {
        await addToken({
          row: 1,
          column: "A",
          name: "token",
          size: "TINY",
          channelId: "1234",
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
            name: "token",
            row: 1,
            column: "A",
            size: "TINY",
            channelId: "1234",
          },
        });
      });
    });
  });

  describe("Move Token", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await moveToken({
        row: 1,
        column: "A",
        name: "token",
        channelId: "1234",
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
          name: "token",
          row: 1,
          column: "A",
          channelId: "1234",
        },
      });
    });
  });

  describe("Delete Token", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await deleteToken({
        name: "token",
        channelId: "1234",
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
          name: "token",
          channelId: "1234",
        },
      });
    });
  });
});
