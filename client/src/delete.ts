import axios from "axios";
import { DiscordProps } from "./types.js";

export type DeleteProps = DiscordProps;

export const deleteChannel = async ({
  applicationId,
  channelId,
  token,
}: DeleteProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/map/${channelId}`;
  axios.delete(triggerUrl, { data: { applicationId, token } });
};
