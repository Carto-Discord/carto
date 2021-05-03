import { createAuthenticatedClient } from "./utils/authentication";
import { handleRequest } from "./utils/requestHandler";
import { deleteChannel } from "./delete";

jest.mock("./utils/authentication");
jest.mock("./utils/requestHandler");

const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.MockedFunction<
  typeof createAuthenticatedClient
>;
const mockHandleRequest = handleRequest as jest.MockedFunction<
  typeof handleRequest
>;

describe("Delete", () => {
  const mockRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    //@ts-ignore
    mockCreateAuthenticatedClient.mockResolvedValue({ request: mockRequest });

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("Delete Channel Map", () => {
    it("should call handleRequest with the appropriate request", async () => {
      await deleteChannel({
        channelId: "1234",
      });

      expect(mockHandleRequest).toBeCalledTimes(1);
      await mockHandleRequest.mock.calls[0][0]();

      expect(mockRequest).toBeCalledWith({
        url: "https://trigger.url",
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        data: { channelId: "1234" },
      });
    });
  });
});
