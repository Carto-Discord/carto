export const getColumnString = (column: number) => {
  let quotient = column;
  let str = "";

  while (quotient > 0) {
    const remainder = (quotient - 1) % 26;
    quotient = Math.floor((quotient - 1) / 26);

    str = String.fromCharCode(65 + remainder) + str;
  }

  return str;
};

export const getColumnNumber = (column: string) => {
  let result = 0;

  for (let i = 0; i < column.length; i++) {
    const c = column.charAt(i).toUpperCase();

    if (c.match(/[A-Z]/i)) {
      result = result * 26 + (c.charCodeAt(0) - "A".charCodeAt(0)) + 1;
    }
  }

  return result;
};
