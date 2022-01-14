type Option =
  | {
      name: string;
      value: string | number | boolean;
    }
  | {
      name: string;
      options?: Option[];
    };

type Data = {
  options: Option[];
  name: string;
  id: string;
};

export type Command =
  | { type: 1 }
  | {
      type: 2;
      channel_id: string;
      token: string;
      application_id: string;
      data: Data;
    };
