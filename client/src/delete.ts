import { createAuthenticatedClient } from "./authentication";

type DeleteProps = {
  channelId: string;
};

export const deleteChannel = async ({
  channelId,
}: DeleteProps): Promise<void> => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;

  const client = await createAuthenticatedClient(triggerUrl);
  await client.request({
    url: triggerUrl,
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    data: { channelId },
  });
};
