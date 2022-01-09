import { createCanvas, loadImage, registerFont } from "canvas";
import { getColumnString, findOptimalFontSize } from "@carto/canvas-utils";

type Props = {
  url: string;
  rows: number;
  columns: number;
};

type GridData = {
  buffer: Buffer;
  margin: {
    x: number;
    y: number;
  };
};

export const createGrid = async ({
  url,
  rows,
  columns,
}: Props): Promise<GridData | undefined> => {
  registerFont("./OpenSans-Regular.ttf", { family: "Open Sans" });

  const image = await loadImage(url).catch(console.warn);

  if (!image) return;

  const columnWidth = image.width / columns;
  const rowHeight = image.height / rows;

  const margin = { x: columnWidth, y: rowHeight };
  const canvas = createCanvas(image.width + margin.x, image.height + margin.y);
  const ctx = canvas.getContext("2d");

  // Draw frame with image offet
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, margin.x, 0);

  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Draw columns
  let currentColumn = 1;

  ctx.font = '10px "Open Sans"';
  findOptimalFontSize({
    context: ctx,
    text: getColumnString(columns),
    maxHeight: margin.x * 0.8,
    maxWidth: margin.y * 0.8,
  });

  for (let x = margin.x; x < canvas.width; x += columnWidth) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, image.height);
    ctx.stroke();

    ctx.fillText(
      getColumnString(currentColumn),
      x + margin.x / 2,
      canvas.height - margin.y / 2,
      margin.x * 0.9
    );

    currentColumn++;
  }

  // Draw rows
  let currentRow = rows;

  findOptimalFontSize({
    context: ctx,
    text: currentRow.toString(),
    maxHeight: margin.x * 0.8,
    maxWidth: margin.y * 0.8,
  });

  for (let y = margin.y; y < canvas.height; y += rowHeight) {
    ctx.beginPath();
    ctx.moveTo(margin.x, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    ctx.fillText(
      currentRow.toString(),
      margin.x / 2,
      y - margin.y / 2,
      margin.x * 0.9
    );

    currentRow--;
  }

  return { buffer: canvas.toBuffer(), margin };
};
