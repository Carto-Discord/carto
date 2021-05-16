import { Request, Response } from "express";
import fetch from "node-fetch";
import { getCurrentMap } from "./firestore";

type Data = {
  action?: "get_map";
  message?: string;
  imageUrl?: string;
  applicationId?: string;
  token?: string;
};

const getMap = async (channelId: string) => {
  const map = await getCurrentMap(channelId);

  if (map) {
    const { publicUrl, tokens } = map;
    const tokenFields = tokens.map((token) => ({
      name: token.name,
      value: `${token.column}${token.row}`,
      inline: true,
    }));

    return {
      type: "rich",
      title: "Map retrieved",
      image: {
        url: publicUrl,
      },
      fields: tokenFields,
    };
  }
};

export const receiver = async (req: Request, res: Response) => {
  const data: Data = req.body;

  const { message, imageUrl, applicationId, token, action } = data;

  if (!applicationId || !token) {
    console.warn("Application ID or token not found, cannot continue");
    return res.status(400).end();
  }

  const embeds = [];

  if (action === "get_map") {
    const embed = await getMap(message);
    embed
      ? embeds.push(embed)
      : embeds.push({
          type: "rich",
          description: "No map found for this channel",
        });
  } else {
    (imageUrl &&
      embeds.push({
        type: "rich",
        description: message,
        image: {
          url: imageUrl,
        },
      })) ||
      embeds.push({
        type: "rich",
        description: message,
      });
  }

  await fetch(
    `https://discord.com/api/v9/webhooks/${applicationId}/${token}/messages/@original`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds,
      }),
    }
  );

  res.status(200).end();
};
