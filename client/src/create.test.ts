describe("Create", () => {
  let createMap: Function;

  const mockFetch = jest.fn();
  const mockDownload = jest.fn();

  const mockStorage = {
    bucket: () => ({
      file: () => ({
        download: mockDownload,
      }),
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
    jest.mock("node-fetch", () => mockFetch);
    jest.mock("./constants", () => ({
      GCS_BUCKET: "bucket",
    }));
    process.env.HTTP_TRIGGER_URL = "https://trigger.url";

    createMap = require("./create").createMap;
  });

  describe("Create Map", () => {
    describe("given the API response is successful", () => {
      beforeEach(() => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ fileName: "file" }),
        });
      });

      it("should download the file and return the name", async () => {
        const response = await createMap({ url: "url", rows: 1, columns: 2 });

        expect(mockFetch).toBeCalledWith("https://trigger.url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            url: "url",
            rows: 1,
            columns: 2,
          }),
        });

        expect(mockDownload).toBeCalledWith({ destination: "file" });
        expect(response).toEqual({ success: true, body: "file" });
      });
    });

    describe("given the API response is unsuccessful", () => {
      beforeEach(() => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ message: "error" }),
        });
      });

      it("should return the API error", async () => {
        const response = await createMap({ url: "url", rows: 1, columns: 2 });

        expect(mockFetch).toBeCalledWith("https://trigger.url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            url: "url",
            rows: 1,
            columns: 2,
          }),
        });

        expect(mockDownload).not.toBeCalled();
        expect(response).toEqual({ success: false, body: "error" });
      });
    });
  });
});
