import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";
import fetch from "node-fetch";

type Data = {
  message?: string;
  imageUrl?: string;
  applicationId?: string;
  token?: string;
};

export const receiver: HttpFunction = (req, res) => {
  const data: Data = req.body;

  const { message, imageUrl, applicationId, token } = data;

  if (!applicationId || !token) {
    console.warn("Application ID or token not found, cannot continue");
    res.status(400).end();
    return;
  }

  const embeds = imageUrl && [
    {
      image: {
        url: imageUrl,
      },
    },
  ];

  fetch(
    `https://discord.com/api/v9/webhooks/${applicationId}/${token}/messages/@original`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        embeds,
      }),
    }
  );

  res.status(200).end();
};
