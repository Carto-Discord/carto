import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

import { deleteChannelData, deleteOrphanedMaps } from "../src/cleanup";
import { getChannels } from "../src/dynamodb";
import { handler } from "../src/index";

const mockLogin = jest.fn();
const mockFetch = jest.fn();

jest.mock("discord.js", () => ({
  Client: class MockClient {
    public login = mockLogin;
    public channels = { fetch: mockFetch };
  },
  GatewayIntentBits: jest.requireActual("discord.js").GatewayIntentBits,
}));
jest.mock("../src/cleanup");
jest.mock("../src/dynamodb");

const mockGetChannels = getChannels as jest.MockedFunction<typeof getChannels>;
const mockDeleteChannelData = deleteChannelData as jest.MockedFunction<
  typeof deleteChannelData
>;
const mockDeleteOrphanedMaps = deleteOrphanedMaps as jest.MockedFunction<
  typeof deleteOrphanedMaps
>;

mockClient(DynamoDBClient);
mockClient(S3Client);

describe("Handler", () => {
  beforeAll(() => {
    process.env.AWS_REGION = "eu-central-1";
    process.env.DISCORD_TOKEN = "mockToken";
  });

  beforeEach(() => {
    jest.resetAllMocks();

    mockFetch.mockRejectedValue({});
    mockDeleteChannelData.mockResolvedValue();
    mockGetChannels.mockResolvedValue(["1234", "5678"]);
  });

  it("should call deleteChannelData", async () => {
    await handler();

    expect(mockLogin).toBeCalledWith("mockToken");
    expect(mockGetChannels).toBeCalledTimes(1);

    expect(mockDeleteChannelData).toBeCalledTimes(2);
    expect(mockDeleteChannelData.mock.calls[0][0]).toMatchObject({
      channelId: "1234",
    });
    expect(mockDeleteChannelData.mock.calls[1][0]).toMatchObject({
      channelId: "5678",
    });

    expect(mockDeleteOrphanedMaps).toBeCalledTimes(1);
  });

  describe("given only some channels exist", () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ id: "1234" })
        .mockRejectedValueOnce({ id: "5678" });
    });

    it("should call deleteChannelData", async () => {
      await handler();

      expect(mockLogin).toBeCalledWith("mockToken");
      expect(mockGetChannels).toBeCalledTimes(1);

      expect(mockDeleteChannelData).toBeCalledTimes(1);
      expect(mockDeleteChannelData.mock.calls[0][0]).toMatchObject({
        channelId: "5678",
      });
    });
  });
});
