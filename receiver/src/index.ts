import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import fetch from "node-fetch";

type Event = {
  data: string;
};

type Data = {
  message?: string;
  imageUrl?: string;
  applicationId?: string;
  token?: string;
};

export const receiver: EventFunction = (event: Event, _context) => {
  const data: Data = JSON.parse(Buffer.from(event.data, "base64").toString());

  const { message, imageUrl, applicationId, token } = data;

  if (!applicationId || !token) {
    console.warn("Application ID or token not found, cannot continue");
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
};
