import fetch from "node-fetch";
import { createMap } from "./create";

jest.mock("node-fetch");

describe("Create", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  describe("Create Map", () => {
    it("should call fetch with the appropriate request", async () => {
      await createMap({
        applicationId: "appId",
        token: "mockToken",
        url: "url",
        rows: 1,
        columns: 2,
        channelId: "1234",
      });

      expect(fetch).toBeCalledWith("https://trigger.url/map/1234", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: "appId",
          columns: 2,
          rows: 1,
          token: "mockToken",
          url: "url",
        }),
      });
    });
  });
});
