import { createAuthenticatedClient } from "./utils/authentication";
import { handleRequest } from "./utils/requestHandler";
import { getMap } from "./get";

jest.mock("./utils/authentication");
jest.mock("./utils/requestHandler");

const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.MockedFunction<
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

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("Get Map", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await getMap({
        channelId: "1234",
      });

      expect(mockHandleRequest).toBeCalledTimes(1);
      await mockHandleRequest.mock.calls[0][0]();

      expect(mockRequest).toBeCalledWith({
        url: "https://trigger.url",
        method: "GET",
        params: {
          channelId: "1234",
        },
      });
    });
  });
});
