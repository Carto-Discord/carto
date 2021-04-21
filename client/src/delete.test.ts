import { createAuthenticatedClient } from "./authentication";
import { deleteChannel } from "./delete";

jest.mock("./authentication");

const mockCreateAuthenticatedClient = createAuthenticatedClient as jest.MockedFunction<
  typeof createAuthenticatedClient
>;

describe("Create", () => {
  const mockRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    //@ts-ignore
    mockCreateAuthenticatedClient.mockResolvedValue({ request: mockRequest });

    process.env.HTTP_TRIGGER_URL = "https://trigger.url";
  });

  describe("Create Map", () => {
    describe("given the API response is successful", () => {
      beforeEach(() => {
        mockRequest.mockResolvedValue({
          status: 204,
        });
      });

      it("should download the file and return the name", async () => {
        await deleteChannel({
          channelId: "1234",
        });

        expect(mockRequest).toBeCalledWith({
          url: "https://trigger.url",
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            channelId: "1234",
          },
        });
      });
    });
  });
});
