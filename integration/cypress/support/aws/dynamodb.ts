import { DynamoDBClient, WriteRequest } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

import { AWSConfig } from "./common";
import { CartoMap, CartoBaseMap, DiscordChannel } from "./types";

export enum Table {
  MAPS = "maps",
  CHANNELS = "channels",
}

type Entries =
  | {
      table: Table.CHANNELS;
      contents: Array<DiscordChannel>;
    }
  | {
      table: Table.MAPS;
      contents: Array<CartoBaseMap | CartoMap>;
    };

export const initialiseDynamoDB = async ({ table, contents }: Entries) => {
  const client = new DynamoDBClient(AWSConfig);
  const ddbDocClient = DynamoDBDocumentClient.from(client);
  const commands = contents.map(
    (item) => new PutCommand({ TableName: table, Item: item })
  );

  await Promise.all(commands.map((command) => ddbDocClient.send(command)));
};

export const teardownDynamoDB = async () => {
  const client = new DynamoDBClient(AWSConfig);
  const scanMapsCommand = new ScanCommand({ TableName: Table.MAPS });
  const scanChannelsCommand = new ScanCommand({ TableName: Table.CHANNELS });

  const maps = await client.send(scanMapsCommand);
  const channels = await client.send(scanChannelsCommand);

  const mapsRequest: WriteRequest[] = maps.Items.map((item) => ({
    DeleteRequest: { Key: { id: item.id } },
  }));
  const channelsRequest: WriteRequest[] = channels.Items.map((item) => ({
    DeleteRequest: { Key: { id: item.id } },
  }));

  const deleteCommand = new BatchWriteCommand({
    RequestItems: {
      [Table.MAPS]: mapsRequest,
      [Table.CHANNELS]: channelsRequest,
    },
  });

  return client.send(deleteCommand);
};
