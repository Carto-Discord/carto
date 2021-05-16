import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";

export type GetProps = {
  applicationId: string;
  channelId: string;
  token: string;
};

export const getMap = async ({ applicationId, channelId, token }: GetProps) => {
  const triggerUrl = process.env.CLIENT_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "get_map",
        applicationId,
        message: channelId,
        token,
      },
    })
  );
};
