import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";
import { PubSubProps } from "./types";

export type DeleteProps = PubSubProps & {
  channelId: string;
};

export const deleteChannel = async ({
  applicationId,
  channelId,
  token,
}: DeleteProps) => {
  const triggerUrl = `${process.env.HTTP_TRIGGER_URL}/map/${channelId}`;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: { applicationId, token },
    })
  );
};
