import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";
import { getMap } from "./get";

jest.mock("./authentication");
jest.mock("./storage");

const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.MockedFunction<
  typeof createAuthenticatedClient
>;
const mockDownloadBlob = downloadBlob as jest.MockedFunction<
  typeof downloadBlob
>;

describe("Get", () => {
  const mockRequest = jest.fn();

  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    //@ts-ignore
    mockCreateAuthenticatedClient.mockResolvedValue({ request: mockRequest });
    mockDownloadBlob.mockResolvedValue("temp file");

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("Get Map", () => {
    describe("given the API response is successful", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 200,
          data: { blob: "file", bucket: "bucket" },
        });
      });

      it("should download the file and return the name", async () => {
        const response = await getMap({
          channelId: "1234",
        });

        expect(mockRequest).toBeCalledWith({
          url: "https://trigger.url",
          method: "GET",
          params: {
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

    describe("given the API response is unsuccessful", () => {
      describe("given the status is less than 500", () => {
        beforeEach(() => {
          mockRequest.mockRejectedValue({
            status: 404,
            data: { message: "error" },
          });
        });

        it("should return the API error", async () => {
          const response = await getMap({
            channelId: "1234",
          });

          expect(mockRequest).toBeCalledWith({
            url: "https://trigger.url",
            method: "GET",
            params: {
              channelId: "1234",
            },
          });

          expect(mockDownloadBlob).not.toBeCalled();
          expect(response).toEqual({ success: false, body: "error" });
        });
      });

      describe("given the status is 500", () => {
        beforeEach(() => {
          mockRequest.mockRejectedValue({
            status: 500,
            data: { message: "error" },
          });
        });

        it("should return the API error", async () => {
          const response = await getMap({
            channelId: "1234",
          });

          expect(mockRequest).toBeCalledWith({
            url: "https://trigger.url",
            method: "GET",
            params: {
              channelId: "1234",
            },
          });

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
});
