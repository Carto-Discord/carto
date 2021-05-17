import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";

export type GetProps = {
  applicationId: string;
  channelId: string;
  token: string;
};

export const getMap = async ({ applicationId, channelId, token }: GetProps) => {
  const triggerUrl = `${process.env.CLIENT_TRIGGER_URL}/map/${channelId}`;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "GET",
      params: {
        applicationId,
        token,
      },
    })
  );
};
