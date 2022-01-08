import fs from "fs";
import { Readable } from "stream";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadImage, registerFont } from "canvas";

export enum Size {
  "TINY" = 0.5,
  "SMALL" = 1,
  "MEDIUM" = 1,
  "LARGE" = 2,
  "HUGE" = 3,
  "GARGANTUAN" = 4,
}

type Coordinates = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

type PlaceTinyTokenProps = {
  index: number;
  coordinates: Coordinates;
};

// Local testing only, ignored in production
const endpoint = process.env.LOCALSTACK_HOSTNAME
  ? `http://localhost:4566`
  : undefined;

export const downloadImage = async (filename: string, filepath: string) => {
  const client = new S3Client({ region: process.env.AWS_REGION, endpoint });
  const command = new GetObjectCommand({
    Bucket: process.env.MAPS_BUCKET,
    Key: filename,
  });

  const { Body } = await client.send(command);

  return new Promise<void>((resolve, reject) => {
    if (Body instanceof Readable) {
      Body.on("error", reject)
        .pipe(fs.createWriteStream(filepath))
        .on("error", reject)
        .on("close", resolve);
    }
  });
};

export const placeTinyToken = ({
  index,
  coordinates,
}: PlaceTinyTokenProps): Coordinates => {
  const { x0, x1, y0, y1 } = coordinates;
  const positionOnSquare = index % 4;

  if (positionOnSquare == 1)
    return { x0, y0, x1: (x0 + x1) / 2, y1: (y0 + y1) / 2 };
  else if (positionOnSquare == 2)
    return { x0: (x0 + x1) / 2, y0, x1, y1: (y0 + y1) / 2 };
  else if (positionOnSquare == 3)
    return { x0, y0: (y0 + y1) / 2, x1: (x0 + x1) / 2, y1 };
  else return { x0: (x0 + x1) / 2, y0: (y0 + y1) / 2, x1, y1 };
};
