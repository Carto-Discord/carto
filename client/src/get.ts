import { createAuthenticatedClient } from "./utils/authentication";
import { handleRequest } from "./utils/requestHandler";

type GetProps = {
  channelId: string;
};

export const getMap = async ({ channelId }: GetProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "GET",
      params: { channelId },
    })
  );
};
