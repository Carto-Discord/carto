import fs from "fs";
import { Readable } from "stream";
import { createCanvas, loadImage, registerFont } from "canvas";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getColumnNumber, findOptimalFontSize } from "@carto/map-utils";

export enum Size {
  "TINY" = 0,
  "SMALL" = 1,
  "MEDIUM" = 1,
  "LARGE" = 2,
  "HUGE" = 3,
  "GARGANTUAN" = 4,
}

export type Token = {
  name: string;
  row: number;
  column: string;
  color: string;
  size: Size;
};

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

type ApplyTokensProps = {
  baseFilename: string;
  margin: {
    x: number;
    y: number;
  };
  tokens: Token[];
};

// Local testing only, ignored in production
const endpoint = process.env.LOCALSTACK_HOSTNAME
  ? `http://localhost:4566`
  : undefined;

export const downloadImage = async (filename: string, filepath: string) => {
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint,
    forcePathStyle: true,
  });
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

export const applyTokensToGrid = async ({
  baseFilename,
  margin,
  tokens,
}: ApplyTokensProps) => {
  registerFont("./OpenSans-Regular.ttf", {
    family: "Open Sans",
  });

  const image = await loadImage(baseFilename).catch(console.warn);

  if (!image) return;

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  let tinyTokensCount = 0;

  tokens.forEach((token) => {
    const { row, column, name, size, color } = token;
    const col = getColumnNumber(column);

    const initialY1 = image.width - row * margin.y;

    let coordinates: Coordinates = {
      x0: col * margin.x,
      x1: (col + size) * margin.x,
      y0: initialY1 - size * margin.y,
      y1: initialY1,
    };

    if (size === Size.TINY) {
      const index = tinyTokensCount++;

      coordinates = placeTinyToken({
        index,
        coordinates: {
          ...coordinates,
          y0: image.width - (row + 1) * margin.y,
          x1: (col + 1) * margin.x,
        },
      });
    }

    const { x0, y0, x1, y1 } = coordinates;

    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const radius = Math.min(x1 - x0, y1 - y0) / 2;

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    const label = name.slice(0, 1).toUpperCase();

    const realTokenSize = size === 0 ? 0.5 : size;

    findOptimalFontSize({
      context: ctx,
      text: label,
      maxWidth: margin.x * realTokenSize * 0.7,
      maxHeight: margin.y * realTokenSize * 0.7,
    });

    ctx.fillText(label, x, y);
    ctx.strokeText(label, x, y);
  });

  return canvas.toBuffer();
};
