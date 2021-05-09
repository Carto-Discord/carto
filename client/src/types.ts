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
  TOKEN_ADD = "add",
  TOKEN_MOVE = "move",
  TOKEN_DELETE = "delete",
}

export type PubSubProps = {
  applicationId: string;
  token: string;
};

export type CommandOptions =
  | CreateProps
  | MapDeleteProps
  | GetProps
  | AddProps
  | MoveProps
  | TokenDeleteProps;
