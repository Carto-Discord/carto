import { Interaction as _Interaction } from "slash-commands";

export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
}

export enum InteractionResponseType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
}

export type Interaction = _Interaction & {
  application_id: string;
};
