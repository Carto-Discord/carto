import { getBlobUrl } from "./storage";

jest.mock("@google-cloud/storage", () => {
  return {
    Storage: jest.fn().mockImplementation(() => ({
      bucket: () => ({
        file: () => ({
          publicUrl: () => "public url",
        }),
      }),
    })),
  };
});

describe("Storage", () => {
  it("should return the public url", async () => {
    const url = await getBlobUrl({ blob: "blob", bucket: "bucket" });

    expect(url).toBe("public url");
  });
});
