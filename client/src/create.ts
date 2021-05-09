import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";
import { PubSubProps } from "./types";

export type CreateProps = PubSubProps & {
  channelId: string;
  columns: number;
  rows: number;
  url: string;
};

export const createMap = async ({
  applicationId,
  channelId,
  columns,
  rows,
  token,
  url,
}: CreateProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "create",
        applicationId,
        channelId,
        columns,
        rows,
        token,
        url,
      },
    })
  );
};
