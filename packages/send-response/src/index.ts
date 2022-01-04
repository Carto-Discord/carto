import axios from "axios";
import type { MessageEmbed } from "discord.js";

type Event = MessageEmbed & {
  application_id: string;
  token: string;
};

export const handler = async (event: string) => {
  const { application_id, token, ...embed }: Event = JSON.parse(event);

  const url = `${process.env.BASE_URL}/webhooks/${application_id}/${token}/messages/@original`;

  await axios.patch(
    url,
    { embeds: [embed] },
    { headers: { "Content-Type": "application/json" } }
  );
};
