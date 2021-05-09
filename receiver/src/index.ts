import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import fetch from "node-fetch";

type EventData = {
  message?: string;
  imageUrl?: string;
  applicationId?: string;
  token?: string;
};

const fromBase64 = (value?: string) =>
  value && Buffer.from(value, "base64").toString();

export const receiver: EventFunction = (data: EventData, _context) => {
  console.log(JSON.stringify(data));

  const message = fromBase64(data?.message);
  const imageUrl = fromBase64(data?.imageUrl);
  const applicationId = fromBase64(data?.applicationId);
  const token = fromBase64(data?.token);

  if (!applicationId || !token) {
    console.warn("Application ID or token not found, cannot continue");
    return;
  }

  const image = imageUrl && {
    url: imageUrl,
  };

  fetch(
    `https://discord.com/api/v9/webhooks/${applicationId}/${token}/messages/@original`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        image,
      }),
    }
  );
};
