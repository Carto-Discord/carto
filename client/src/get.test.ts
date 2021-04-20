describe("Get", () => {
  let getMap: Function;

  const mockRequest = jest.fn();
  const mockDownload = jest.fn();

  const mockStorage = {
    bucket: () => ({
      file: () => ({
        download: mockDownload,
      }),
    }),
  };
  const mockAuth = {
    getIdTokenClient: jest.fn().mockResolvedValue({
      request: mockRequest,
    }),
  };

  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mock("@google-cloud/storage", () => {
      return {
        Storage: jest.fn().mockImplementation(() => {
          return mockStorage;
        }),
      };
    });
    jest.mock("google-auth-library", () => {
      return {
        GoogleAuth: jest.fn().mockImplementation(() => {
          return mockAuth;
        }),
      };
    });
    process.env.HTTP_TRIGGER_URL = "https://trigger.url";

    getMap = require("./get").getMap;
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

        expect(mockDownload).toBeCalledWith({ destination: "/tmp/file" });
        expect(response).toEqual({ success: true, body: "/tmp/file" });
      });
    });

    describe("given the API response is unsuccessful", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
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

        expect(mockDownload).not.toBeCalled();
        expect(response).toEqual({ success: false, body: "error" });
      });
    });
  });
});
