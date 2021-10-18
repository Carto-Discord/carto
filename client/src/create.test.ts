import mockAxios from "jest-mock-axios";
import { createMap } from "./create";

describe("Create", () => {
  beforeEach(() => {
    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe("Create Map", () => {
    it("should call axios with the appropriate request", async () => {
      await createMap({
        applicationId: "appId",
        token: "mockToken",
        url: "url",
        rows: 1,
        columns: 2,
        channelId: "1234",
      });

      expect(mockAxios.post).toBeCalledWith("https://trigger.url/map/1234", {
        applicationId: "appId",
        columns: 2,
        rows: 1,
        token: "mockToken",
        url: "url",
      });
    });
  });
});
