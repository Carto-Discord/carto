import { createAuthenticatedClient } from "./utils/authentication";
import { handleRequest } from "./utils/requestHandler";

export type CreateProps = {
  url: string;
  rows: number;
  columns: number;
  channelId: string;
};

export const createMap = async ({
  url,
  rows,
  columns,
  channelId,
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
        url,
        rows,
        columns,
        channelId,
      },
    })
  );
};
