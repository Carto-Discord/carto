import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";
import { PubSubProps } from "./types";

export type AddProps = PubSubProps & {
  condition?: string;
  colour?: string;
  column: string;
  channelId: string;
  name: string;
  row: number;
  size?: string;
};

export type MoveProps = PubSubProps & {
  column: string;
  channelId: string;
  name: string;
  row: number;
};

export type DeleteProps = PubSubProps & {
  channelId: string;
  name: string;
};

export const addToken = async ({
  applicationId,
  channelId,
  colour,
  column,
  condition,
  name,
  row,
  size = "MEDIUM",
  token,
}: AddProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "addToken",
        applicationId,
        channelId,
        colour,
        column,
        condition,
        name,
        row,
        size,
        token,
      },
    })
  );
};

export const moveToken = async ({
  applicationId,
  channelId,
  column,
  name,
  row,
  token,
}: MoveProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "moveToken",
        applicationId,
        channelId,
        column,
        name,
        row,
        token,
      },
    })
  );
};

export const deleteToken = async ({
  applicationId,
  channelId,
  name,
  token,
}: DeleteProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: { action: "deleteToken", applicationId, channelId, name, token },
    })
  );
};
