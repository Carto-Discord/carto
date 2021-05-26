import fetch from "node-fetch";
import { DiscordProps } from "./types";

export type AddProps = DiscordProps & {
  condition?: string;
  colour?: string;
  column: string;
  channelId: string;
  name: string;
  row: number;
  size?: string;
};

export type MoveProps = DiscordProps & {
  column: string;
  channelId: string;
  name: string;
  row: number;
};

export type DeleteProps = DiscordProps & {
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
  const triggerUrl = `${process.env.API_TRIGGER_URL}/token/${channelId}`;

  fetch(triggerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId,
      colour,
      column,
      condition,
      name,
      row,
      size,
      token,
    }),
  });
};

export const moveToken = async ({
  applicationId,
  channelId,
  column,
  name,
  row,
  token,
}: MoveProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/token/${channelId}`;

  fetch(triggerUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId,
      column,
      name,
      row,
      token,
    }),
  });
};

export const deleteToken = async ({
  applicationId,
  channelId,
  name,
  token,
}: DeleteProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/token/${channelId}`;

  fetch(triggerUrl, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId,
      name,
      token,
    }),
  });
};
