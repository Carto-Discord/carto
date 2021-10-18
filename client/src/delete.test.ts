import mockAxios from "jest-mock-axios";
import { deleteChannel } from "./delete";

describe("Delete", () => {
  beforeEach(() => {
    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe("Delete Channel Map", () => {
    it("should call axios with the appropriate request", async () => {
      await deleteChannel({
        applicationId: "appId",
        channelId: "1234",
        token: "mockToken",
      });

      expect(mockAxios.delete).toBeCalledWith("https://trigger.url/map/1234", {
        data: { applicationId: "appId", token: "mockToken" },
      });
    });
  });
});
