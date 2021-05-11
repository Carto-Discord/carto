import { EmbedFieldData, MessageEmbed } from "discord.js";
import { Response } from "express";
import { InteractionResponseType } from "slash-commands";
import { getCurrentMap } from "./firestore";

export type GetProps = {
  channelId: string;
  res: Response;
};

export const getMap = async ({ channelId, res }: GetProps) => {
  const map = await getCurrentMap(channelId);

  if (map) {
    const { publicUrl, tokens } = map;
    const tokenFields: EmbedFieldData[] = tokens.map((token) => ({
      name: token.name,
      value: `${token.column}${token.row}`,
      inline: true,
    }));

    const embed = new MessageEmbed()
      .setTitle("Map retrieved")
      .setImage(publicUrl)
      .addFields(tokenFields);

    res
      .status(200)
      .json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [embed.toJSON()],
        },
      })
      .end();
  } else {
    res
      .status(200)
      .json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "No map no found for this channel",
        },
      })
      .end();
  }
};
