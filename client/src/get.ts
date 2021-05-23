import fetch from "node-fetch";

export type GetProps = {
  applicationId: string;
  channelId: string;
  token: string;
};

export const getMap = async ({ applicationId, channelId, token }: GetProps) => {
  const triggerUrl = `http://${process.env.API_TRIGGER_URL}/map/${channelId}?`;
  const params = new URLSearchParams({ applicationId, token });
  console.log(triggerUrl + params);

  return fetch(triggerUrl + params);
};
