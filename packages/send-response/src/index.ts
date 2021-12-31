import axios from "axios";
import type { MessageEmbed } from "discord.js";

type Event = MessageEmbed & {
  application_id: string;
  token: string;
};

export const handler = async (event: Event) => {
  const { application_id, token, ...embed } = event;

  const url = `${process.env.BASE_URL}/webhooks/${application_id}/${token}/messages/@original`;
  console.debug(url);

  const response = await axios.patch(
    url,
    { embeds: [embed] },
    { headers: { "Content-Type": "application/json" } }
  );

  return response;
};
