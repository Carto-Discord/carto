import fetch from "node-fetch";
import { DiscordProps } from "./types.js";

export type DeleteProps = DiscordProps;

export const deleteChannel = async ({
  applicationId,
  channelId,
  token,
}: DeleteProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/map/${channelId}`;
  fetch(triggerUrl, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId,
      token,
    }),
  });
};
