import { Firestore } from "@google-cloud/firestore";
import { getCurrentMap } from "./firestore";

jest.mock("@google-cloud/firestore");

const mockFirestore = Firestore as jest.MockedClass<typeof Firestore>;

describe("Firestore", () => {
  const mockGet = jest.fn();
  const mockCollection = {
    doc: () => ({ get: mockGet }),
  };
  const mockClient = {
    collection: () => mockCollection,
  };
  //@ts-ignore
  mockFirestore.mockImplementation(() => mockClient);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAP_BUCKET = "maps";
  });

  describe("given the channelDoc does not exist", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({ exists: false });
    });

    it("should return undefined", async () => {
      const result = await getCurrentMap("123");

      expect(result).toBeUndefined();
    });
  });

  describe("given the channelDoc does exist", () => {
    describe("given the mapDoc does not exist", () => {
      beforeEach(() => {
        mockGet
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ current: "456" }),
          })
          .mockResolvedValueOnce({ exists: false });
      });

      it("should return undefined", async () => {
        const result = await getCurrentMap("123");

        expect(result).toBeUndefined();
      });
    });

    describe("given the mapDoc does exist", () => {
      beforeEach(() => {
        mockGet
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ current: "456" }),
          })
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ tokens: [{ name: "token1" }] }),
          });
      });

      it("should return the public url and tokens", async () => {
        const result = await getCurrentMap("123");

        expect(result).toEqual({
          publicUrl: "https://storage.googleapis.com/maps/456.png",
          tokens: [{ name: "token1" }],
        });
      });
    });
  });
});
