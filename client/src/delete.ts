import { createAuthenticatedClient } from "./utils/authentication";
import { handleRequest } from "./utils/requestHandler";

export type DeleteProps = {
  channelId: string;
};

export const deleteChannel = async ({ channelId }: DeleteProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: { channelId },
    })
  );
};
