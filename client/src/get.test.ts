import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";
import { getMap } from "./get";

jest.mock("./authentication");
jest.mock("./requestHandler");

const mockCreateAuthenticatedClient =
  createAuthenticatedClient as jest.MockedFunction<
    typeof createAuthenticatedClient
  >;
const mockHandleRequest = handleRequest as jest.MockedFunction<
  typeof handleRequest
>;

describe("Get", () => {
  const mockRequest = jest.fn();

  jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    //@ts-ignore
    mockCreateAuthenticatedClient.mockResolvedValue({ request: mockRequest });

    process.env.CLIENT_TRIGGER_URL = "https://trigger.url";
  });

  describe("Create Map", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await getMap({
        applicationId: "appId",
        token: "mockToken",
        channelId: "1234",
      });

      expect(mockHandleRequest).toBeCalledTimes(1);
      await mockHandleRequest.mock.calls[0][0]();

      expect(mockRequest).toBeCalledWith({
        url: "https://trigger.url",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          action: "get_map",
          applicationId: "appId",
          token: "mockToken",
          message: "1234",
        },
      });
    });
  });
});
