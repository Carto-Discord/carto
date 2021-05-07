import { getBlobUrl } from "./storage";
import { handleRequest } from "./requestHandler";

jest.mock("./storage");

const mockGetBlobUrl = getBlobUrl as jest.MockedFunction<typeof getBlobUrl>;

describe("Handle Request", () => {
  const mockRequest = jest.fn();

  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetBlobUrl.mockResolvedValue("temp file");
    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("given the request is successful", () => {
    describe("given no message is received", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 201,
          data: { blob: "file", bucket: "bucket" },
        });
      });

      it("should download the file and return the name", async () => {
        const response = await handleRequest(mockRequest);

        expect(mockRequest).toBeCalled();
        expect(mockGetBlobUrl).toBeCalledWith({
          blob: "file",
          bucket: "bucket",
        });
        expect(response).toEqual({ success: true, body: "temp file" });
      });
    });

    describe("given a message is received", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 201,
          data: { blob: "file", bucket: "bucket", message: "hello" },
        });
      });

      it("should download the file and return the name with the message", async () => {
        const response = await handleRequest(mockRequest);

        expect(mockRequest).toBeCalled();
        expect(mockGetBlobUrl).toBeCalledWith({
          blob: "file",
          bucket: "bucket",
        });
        expect(response).toEqual({
          success: true,
          body: "temp file",
          message: "hello",
        });
      });
    });
  });

  describe("given the request is unsuccessful", () => {
    describe("given the status is less than 500", () => {
      beforeEach(() => {
        mockRequest.mockRejectedValue({
          response: {
            status: 400,
            data: { message: "error" },
          },
        });
      });

      it("should return the API error", async () => {
        const response = await handleRequest(mockRequest);

        expect(mockRequest).toBeCalled();
        expect(mockGetBlobUrl).not.toBeCalled();
        expect(response).toEqual({ success: false, body: "error" });
      });
    });

    describe("given the status is 500", () => {
      beforeEach(() => {
        mockRequest.mockRejectedValue({
          response: {
            status: 500,
            data: { message: "error" },
          },
        });
      });

      it("should return the API error", async () => {
        const response = await handleRequest(mockRequest);

        expect(mockRequest).toBeCalled();
        expect(mockGetBlobUrl).not.toBeCalled();
        expect(response).toEqual({
          success: false,
          body:
            "A server error occured. Please raise a GitHub issue detailing the problem.",
        });
      });
    });
  });
});
