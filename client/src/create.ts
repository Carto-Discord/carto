import fetch from "node-fetch";
import { DiscordProps } from "./types";

export type CreateProps = DiscordProps & {
  channelId: string;
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
  fetch(triggerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId,
      columns,
      rows,
      token,
      url,
    }),
  });
};
