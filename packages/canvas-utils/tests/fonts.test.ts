import { createCanvas } from "canvas";

import { findOptimalFontSize } from "../src/fonts";

describe("Find Optimal Font size", () => {
  it("should find the optimum size", () => {
    const context = createCanvas(200, 200).getContext("2d");
    context.textBaseline = "middle";

    findOptimalFontSize({ context, text: "text", maxWidth: 50, maxHeight: 30 });

    expect(context.font).toEqual("28px sans-serif");
  });
});
