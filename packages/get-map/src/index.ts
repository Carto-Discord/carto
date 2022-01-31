import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import type { EmbedField } from "discord.js";

type Event = {
  application_id: string;
  channel_id: string;
  token: string;
};

const ERROR_TITLE = "Error retrieving map";
const SUCCESS_TITLE = "Retrieved map";

export const handler = async ({
  application_id,
  channel_id,
  token,
}: Event): Promise<APIGatewayProxyResult> => {
  // Local testing only, ignored in production
  const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://localhost:4566`
    : undefined;

  const dynamodbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint,
  });
  const getChannelItemCommand = new GetItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channel_id } },
  });

  const channelItem = await dynamodbClient.send(getChannelItemCommand);
  const uuid = channelItem.Item?.currentMap?.S;

  if (!channelItem.Item || !uuid) {
    console.warn(`This channel has no map associated with it: ${channel_id}`);

    const embed = {
      title: ERROR_TITLE,
      description: "This channel has no map associated with it",
      type: "rich",
    };

    return {
      statusCode: 404,
      body: JSON.stringify({
        token,
        application_id,
        embed,
      }),
    };
  }

  console.info(`Getting map for channel ${uuid}`);

  const getMapItemCommand = new GetItemCommand({
    TableName: process.env.MAPS_TABLE,
    Key: { id: { S: uuid } },
  });

  const mapItem = await dynamodbClient.send(getMapItemCommand);

  if (!mapItem.Item) {
    console.warn(`Map data is missing: ${uuid}`);

    const embed = {
      title: ERROR_TITLE,
      description:
        "Map data for this channel is incomplete\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.",
      type: "rich",
    };

    return {
      statusCode: 500,
      body: JSON.stringify({
        token,
        application_id,
        embed,
      }),
    };
  }

  const tokens = mapItem.Item.tokens?.L || [];
  const fields: EmbedField[] = tokens.map(({ M: token }, i) => ({
    name: token?.name.S || `token ${i}`,
    value: `${token?.column.S?.toUpperCase()}${token?.row.N}`,
    inline: true,
  }));

  const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${uuid}.png`;

  const embed = {
    title: SUCCESS_TITLE,
    image: { url },
    fields,
    type: "rich",
  };

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      application_id,
      embed,
    }),
  };
};
