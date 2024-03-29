import axios from "axios";
import type { Embed } from "discord.js";

export type Event = {
  application_id: string;
  token: string;
  embed?: Embed;
  error?: string;
};

export const handler = async ({
  application_id,
  token,
  embed,
  error,
}: Event) => {
  const url = `${process.env.BASE_URL}/webhooks/${application_id}/${token}/messages/@original`;

  const errorEmbed = {
    title: "Command execution failed",
    description:
      "The command failed to process, likely due to an internal error.",
    type: "rich",
  };

  if (error) console.warn({ error }, "Handling error");

  await axios.patch(
    url,
    { embeds: [error ? errorEmbed : embed] },
    { headers: { "Content-Type": "application/json" } }
  );
};
