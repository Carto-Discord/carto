import axios from "axios";
import { DiscordProps } from "./types.js";

export type CreateProps = DiscordProps & {
  columns: number;
  rows: number;
  url: string;
};

export const createMap = async ({
  applicationId,
  channelId,
  columns,
  rows,
  token,
  url,
}: CreateProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/map/${channelId}`;
  axios.post(triggerUrl, {
    applicationId,
    columns,
    rows,
    token,
    url,
  });
};
