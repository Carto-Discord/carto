import mockAxios from "jest-mock-axios";
import { getMap } from "./get";

describe("Get", () => {
  beforeEach(() => {
    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe("Get Map", () => {
    it("should call axios with the appropriate request", async () => {
      await getMap({
        applicationId: "appId",
        token: "mockToken",
        channelId: "1234",
      });

      expect(mockAxios.get).toBeCalledWith(
        "https://trigger.url/map/1234?applicationId=appId&token=mockToken"
      );
    });
  });
});
