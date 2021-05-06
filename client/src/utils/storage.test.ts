import { downloadBlob } from "./storage";

jest.mock("@google-cloud/storage", () => {
  return {
    Storage: jest.fn().mockImplementation(() => ({
      bucket: () => ({
        file: () => ({
          download: async () => Promise.resolve({ data: true }),
        }),
      }),
    })),
  };
});

describe("Storage", () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  it("should return the tempfile name", async () => {
    const tempFile = await downloadBlob({ blob: "blob", bucket: "bucket" });

    expect(tempFile).toBe("/tmp/blob");
    expect(logSpy).toBeCalledWith("gs://bucket/blob downloaded to /tmp/blob.");
  });
});
