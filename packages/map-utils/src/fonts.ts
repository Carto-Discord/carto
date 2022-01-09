import { NodeCanvasRenderingContext2D } from "canvas";

type OptimalFontSizeProps = {
  context: NodeCanvasRenderingContext2D;
  text: string;
  maxWidth: number;
  maxHeight: number;
};

export const findOptimalFontSize = ({
  context,
  text,
  maxWidth,
  maxHeight,
}: OptimalFontSizeProps) => {
  let fontHeight = 0;
  let metrics: TextMetrics;

  const family = context.font.split(" ")[1];

  do {
    fontHeight++;
    context.font = `${fontHeight}px ${family}`;
    metrics = context.measureText(text);
  } while (
    metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight < maxWidth &&
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent <
      maxHeight
  );
};
