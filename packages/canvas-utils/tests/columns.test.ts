import { getColumnString, getColumnNumber } from "../src/columns";

describe("Column String", () => {
  it.each([
    ["AB", 28],
    ["ZY", 701],
    ["ZZ", 702],
  ])("should return %s for column %d", (expected, col) => {
    expect(getColumnString(col)).toEqual(expected);
  });
});

describe("Column Number", () => {
  it.each([
    [28, "AB"],
    [701, "ZY"],
    [702, "ZZ"],
  ])("should return %d for column %s", (expected, col) => {
    expect(getColumnNumber(col)).toEqual(expected);
  });
});
