import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";
import { createMap } from "./create";

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

  describe("Create Map", () => {
    describe("given the API response is successful", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 201,
          data: { blob: "file", bucket: "bucket" },
        });
      });

      it("should download the file and return the name", async () => {
        const response = await createMap({
          url: "url",
          rows: 1,
          columns: 2,
          channelId: "1234",
        });

        expect(mockRequest).toBeCalledWith({
          url: "https://trigger.url",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            url: "url",
            rows: 1,
            columns: 2,
            channelId: "1234",
          }),
        });

        expect(mockDownloadBlob).toBeCalledWith({
          blob: "file",
          bucket: "bucket",
        });
        expect(response).toEqual({ success: true, body: "temp file" });
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
        const response = await createMap({
          url: "url",
          rows: 1,
          columns: 2,
          channelId: "1234",
        });

        expect(mockRequest).toBeCalledWith({
          url: "https://trigger.url",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            url: "url",
            rows: 1,
            columns: 2,
            channelId: "1234",
          }),
        });

        expect(mockDownloadBlob).not.toBeCalled();
        expect(response).toEqual({ success: false, body: "error" });
      });
    });
  });
});
