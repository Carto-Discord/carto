import { downloadBlob } from "./storage";
import { handleRequest } from "./requestHandler";

jest.mock("./storage");

const mockDownloadBlob = downloadBlob as jest.MockedFunction<
  typeof downloadBlob
>;

describe("Handle Request", () => {
  const mockRequest = jest.fn();

  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();

    mockDownloadBlob.mockResolvedValue("temp file");
    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("given the request is successful", () => {
    beforeEach(() => {
      mockRequest.mockResolvedValue({
        status: 201,
        data: { blob: "file", bucket: "bucket" },
      });
    });

    it("should download the file and return the name", async () => {
      const response = await handleRequest(mockRequest);

      expect(mockRequest).toBeCalled();
      expect(mockDownloadBlob).toBeCalledWith({
        blob: "file",
        bucket: "bucket",
      });
      expect(response).toEqual({ success: true, body: "temp file" });
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
        expect(mockDownloadBlob).not.toBeCalled();
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
        expect(mockDownloadBlob).not.toBeCalled();
        expect(response).toEqual({
          success: false,
          body:
            "A server error occured. Please raise a GitHub issue detailing the problem.",
        });
      });
    });
  });
});
