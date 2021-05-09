import { handleRequest } from "./requestHandler";

describe("Handle Request", () => {
  const mockRequest = jest.fn();

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("given the request is successful", () => {
    beforeEach(() => {
      mockRequest.mockResolvedValue({
        status: 200,
      });
    });

    it("should not log", async () => {
      await handleRequest(mockRequest);

      expect(mockRequest).toBeCalled();
      expect(warnSpy).not.toBeCalled();
    });
  });

  describe("given the request is unsuccessful", () => {
    beforeEach(() => {
      mockRequest.mockRejectedValue("error");
    });

    it("should log the error", async () => {
      await handleRequest(mockRequest);

      expect(mockRequest).toBeCalled();
      expect(warnSpy).toBeCalledWith(
        "Non-ok response received.\n Error: error"
      );
    });
  });
});
