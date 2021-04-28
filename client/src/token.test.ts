import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";
import { addToken } from "./token";

jest.mock("./authentication");
jest.mock("./storage");

const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.MockedFunction<
  typeof createAuthenticatedClient
>;
const mockDownloadBlob = downloadBlob as jest.MockedFunction<
  typeof downloadBlob
>;

describe("Create", () => {
  const mockRequest = jest.fn();

  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    //@ts-ignore
    mockCreateAuthenticatedClient.mockResolvedValue({ request: mockRequest });
    mockDownloadBlob.mockResolvedValue("temp file");

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("Add Token", () => {
    describe("given the API response is successful", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 201,
          data: { blob: "file", bucket: "bucket" },
        });
      });

      describe("given size is not provided", () => {
        it("should download the file and return the name", async () => {
          const response = await addToken({
            row: 1,
            column: "A",
            name: "token",
            channelId: "1234",
          });

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
              channelId: "1234",
            },
          });

          expect(mockDownloadBlob).toBeCalledWith({
            blob: "file",
            bucket: "bucket",
          });
          expect(response).toEqual({ success: true, body: "temp file" });
        });
      });

      describe("given size is provided", () => {
        it("should download the file and return the name", async () => {
          const response = await addToken({
            row: 1,
            column: "A",
            name: "token",
            size: "TINY",
            channelId: "1234",
          });

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

          expect(mockDownloadBlob).toBeCalledWith({
            blob: "file",
            bucket: "bucket",
          });
          expect(response).toEqual({ success: true, body: "temp file" });
        });
      });
    });

    describe("given the API response is unsuccessful", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 400,
          data: { message: "error" },
        });
      });

      it("should return the API error", async () => {
        const response = await addToken({
          name: "token",
          row: 1,
          column: "A",
          channelId: "1234",
        });

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
            channelId: "1234",
          },
        });

        expect(mockDownloadBlob).not.toBeCalled();
        expect(response).toEqual({ success: false, body: "error" });
      });
    });

    describe("given the API response is a failure", () => {
      beforeEach(() => {
        mockRequest.mockRejectedValue("Error");
      });

      it("should return a generic error", async () => {
        const response = await addToken({
          name: "token",
          row: 1,
          column: "A",
          channelId: "1234",
        });

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
            channelId: "1234",
          },
        });

        expect(mockDownloadBlob).not.toBeCalled();
        expect(response).toEqual({
          success: false,
          body: "An unknown error occured.",
        });
      });
    });
  });
});
