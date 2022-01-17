import axios from "axios";
import type { MessageEmbed } from "discord.js";

export type Event = {
  application_id: string;
  token: string;
  embed?: MessageEmbed;
  error?: string;
};

export const handler = async (event: string) => {
  const { application_id, token, embed, error }: Event = JSON.parse(event);

  const url = `${process.env.BASE_URL}/webhooks/${application_id}/${token}/messages/@original`;

  const errorEmbed = {
    title: "Command execution failed",
    description:
      "The command failed to process, likely due to an internal error.",
    type: "rich",
  };

  if (error) console.warn({ error }, "Handling error");

  return axios.patch(
    url,
    { embeds: [error ? errorEmbed : embed] },
    { headers: { "Content-Type": "application/json" } }
  );
};
