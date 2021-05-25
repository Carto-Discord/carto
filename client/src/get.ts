import fetch from "node-fetch";
import { DiscordProps } from "./types";

export type GetProps = DiscordProps & {
  channelId: string;
};

export const getMap = async ({ applicationId, channelId, token }: GetProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/map/${channelId}?`;
  const params = new URLSearchParams({ applicationId, token });

  return fetch(triggerUrl + params);
};
