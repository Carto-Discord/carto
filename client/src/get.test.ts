import fetch from "node-fetch";
import { getMap } from "./get";

jest.mock("node-fetch");

describe("Get", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  describe("Get Map", () => {
    it("should call fetch with the appropriate request", async () => {
      await getMap({
        applicationId: "appId",
        token: "mockToken",
        channelId: "1234",
      });

      expect(fetch).toBeCalledWith(
        "https://trigger.url/map/1234?applicationId=appId&token=mockToken"
      );
    });
  });
});
