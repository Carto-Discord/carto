import { createAuthenticatedClient } from "./authentication";
import { handleRequest } from "./requestHandler";

export type AddProps = {
  name: string;
  row: number;
  column: string;
  size?: string;
  condition?: string;
  colour?: string;
  channelId: string;
};

export type MoveProps = {
  name: string;
  row: number;
  column: string;
  channelId: string;
};

export type DeleteProps = {
  name: string;
  channelId: string;
};

export const addToken = async ({
  name,
  row,
  column,
  size = "MEDIUM",
  condition,
  colour,
  channelId,
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
        name,
        row,
        column,
        size,
        condition,
        colour,
        channelId,
      },
    })
  );
};

export const moveToken = async ({
  name,
  row,
  column,
  channelId,
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
        name,
        row,
        column,
        channelId,
      },
    })
  );
};

export const deleteToken = async ({ name, channelId }: DeleteProps) => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const client = await createAuthenticatedClient(triggerUrl);

  return handleRequest(() =>
    client.request({
      url: triggerUrl,
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "deleteToken",
        name,
        channelId,
      },
    })
  );
};
