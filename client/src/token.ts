import axios from "axios";
import { DiscordProps } from "./types.js";

export type AddProps = DiscordProps & {
  condition?: string;
  colour?: string;
  column: string;
  name: string;
  row: number;
  size?: string;
};

export type MoveProps = DiscordProps & {
  column: string;
  name: string;
  row: number;
};

export type DeleteProps = DiscordProps & {
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
  axios.post(triggerUrl, {
    applicationId,
    colour,
    column,
    condition,
    name,
    row,
    size,
    token,
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
  axios.put(triggerUrl, {
    applicationId,
    column,
    name,
    row,
    token,
  });
};

export const deleteToken = async ({
  applicationId,
  channelId,
  name,
  token,
}: DeleteProps) => {
  const triggerUrl = `${process.env.API_TRIGGER_URL}/token/${channelId}`;
  axios.delete(triggerUrl, {
    data: {
      applicationId,
      name,
      token,
    },
  });
};
