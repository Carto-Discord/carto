import axios from "axios";
import type { Embed } from "discord.js";

export type Event = {
  application_id: string;
  token: string;
  embed?: Embed;
  error?: string;
};

const errorEmbed = {
  title: "Command execution failed",
  description:
    "The command failed to process, likely due to an internal error.",
  type: "rich",
};

export const handler = async ({
  application_id,
  token,
  embed,
  error,
}: Event) => {
  const embeds = [error ? errorEmbed : embed];

  if (error) console.warn({ error }, "Handling error");

  if (process.env.ENVIRONMENT === "test") {
    return embeds;
  }

  const url = `${process.env.BASE_URL}/webhooks/${application_id}/${token}/messages/@original`;

  await axios.patch(
    url,
    { embeds },
    { headers: { "Content-Type": "application/json" } }
  );
};
