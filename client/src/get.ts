import axios from "axios";
import { DiscordProps } from "./types.js";

export type GetProps = DiscordProps;

export const getMap = async ({ applicationId, channelId, token }: GetProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/map/${channelId}?`;
  const params = new URLSearchParams({ applicationId, token });
  axios.get(triggerUrl + params);
};
