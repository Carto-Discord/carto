import fetch from "node-fetch";
import { deleteChannel } from "./delete";

jest.mock("node-fetch");

describe("Delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.API_TRIGGER_URL = "https://trigger.url";
  });

  describe("Delete Channel Map", () => {
    it("should call fetch with the appropriate request", async () => {
      await deleteChannel({
        applicationId: "appId",
        channelId: "1234",
        token: "mockToken",
      });

      expect(fetch).toBeCalledWith("https://trigger.url/map/1234", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: "appId", token: "mockToken" }),
      });
    });
  });
});
