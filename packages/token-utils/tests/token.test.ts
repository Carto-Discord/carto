import fs from "fs";
import { PassThrough } from "stream";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

import {
  applyTokensToGrid,
  downloadImage,
  placeTinyToken,
  Size,
} from "../src/token";

describe("Download image", () => {
  const mockS3Client = mockClient(S3Client);

  beforeEach(() => {
    mockS3Client.reset();
  });

  it("should save the image to a file", async () => {
    const filepath = "test.txt";
    const data = "hello world";

    const mockStream = new PassThrough();
    mockS3Client.on(GetObjectCommand).resolves({ Body: mockStream });

    const result = downloadImage("text.txt", filepath);

    setTimeout(() => {
      mockStream.emit("data", data);
      mockStream.emit("end");
    }, 100);

    await expect(result).resolves.toBeUndefined();
    expect(fs.readFileSync(filepath).toString()).toEqual(data);

    fs.unlinkSync(filepath);
  });

  it("should reject on a error", async () => {
    const filepath = "test.txt";

    const mockStream = new PassThrough();
    mockS3Client.on(GetObjectCommand).resolves({ Body: mockStream });

    const result = downloadImage("text.txt", filepath);
    const mockError = new Error("Something went wrong");

    setTimeout(() => {
      mockStream.emit("error", mockError);
      mockStream.emit("end");
    }, 100);

    await expect(result).rejects.toEqual(mockError);
    expect(fs.readFileSync(filepath).toString()).toEqual("");

    fs.unlinkSync(filepath);
  });
});

describe("Place Tiny Token", () => {
  const coordinates = {
    x0: 0,
    y0: 0,
    x1: 10,
    y1: 15,
  };

  it.each([
    [1, { x0: 0, y0: 0, x1: 5, y1: 7.5 }],
    [2, { x0: 5, y0: 0, x1: 10, y1: 7.5 }],
    [3, { x0: 0, y0: 7.5, x1: 5, y1: 15 }],
    [4, { x0: 5, y0: 7.5, x1: 10, y1: 15 }],
    [5, { x0: 0, y0: 0, x1: 5, y1: 7.5 }],
  ])(
    "should return the correct position for position %d",
    (index, expected) => {
      expect(placeTinyToken({ index, coordinates })).toEqual(expected);
    }
  );
});

// Local testing only, for now
describe.skip("Apply tokens to grid", () => {
  it("should create the new image", async () => {
    const tokens = [
      {
        name: "Alvyn",
        color: "blue",
        column: "D",
        row: 7,
        size: Size.MEDIUM,
      },
      {
        name: "Ben",
        color: "pink",
        column: "F",
        row: 14,
        size: Size.TINY,
      },
      {
        name: "Chloe",
        color: "green",
        column: "F",
        row: 14,
        size: Size.TINY,
      },
    ];
    const buffer = await applyTokensToGrid({
      baseFilename: "test.png",
      margin: { x: 55, y: 55 },
      tokens,
    });

    fs.writeFileSync("tokens.png", buffer);
  });
});
