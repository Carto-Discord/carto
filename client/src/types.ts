import { CreateProps } from "./create";
import { DeleteProps as MapDeleteProps } from "./delete";
import { GetProps } from "./get";
import { AddProps, MoveProps, DeleteProps as TokenDeleteProps } from "./token";

export enum CommandGroup {
  MAP = "map",
  TOKEN = "token",
}

export enum SubCommand {
  MAP_CREATE = "create",
  MAP_GET = "get",
  MAP_DELETE = "delete",
  TOKEN_ADD = "add",
  TOKEN_MOVE = "move",
  TOKEN_DELETE = "delete",
}

export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
}

export enum InteractionResponseType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
}

export type DiscordProps = {
  applicationId: string;
  channelId: string;
  token: string;
};

export type CommandOptions =
  | CreateProps
  | MapDeleteProps
  | GetProps
  | AddProps
  | MoveProps
  | TokenDeleteProps;
