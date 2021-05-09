import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";
import { PubSubProps } from "./types";

export type GetProps = PubSubProps & {
  channelId: string;
};

export const getMap = async ({ applicationId, channelId, token }: GetProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "GET",
      params: { applicationId, channelId, token },
    })
  );
};
