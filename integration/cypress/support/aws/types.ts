export type Token = {
  colour: string;
  column: string;
  name: string;
  row: number;
  size: number;
};

export type CartoMap = {
  id: string;
  tokens: Array<Token>;
};

export type CartoBaseMap = {
  id: string;
  columns: number;
  margin_x: number;
  margin_y: number;
  rows: number;
  url: string;
};

export type DiscordChannel = {
  id: string;
  base: string;
  current: string;
  history: string[];
};
