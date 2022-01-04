import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { MessageEmbed, EmbedField } from "discord.js";

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
  const { LOCALSTACK_HOSTNAME } = process.env;
  const endpoint = LOCALSTACK_HOSTNAME
    ? `http://${LOCALSTACK_HOSTNAME}:4566`
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

    const embed = new MessageEmbed({
      title: ERROR_TITLE,
      description: "This channel has no map associated with it",
    });

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

    const embed = new MessageEmbed({
      title: ERROR_TITLE,
      description: "Map data in incomplete, please report this to bot admins",
    });

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

  const embed = new MessageEmbed({
    title: SUCCESS_TITLE,
    image: { url },
    fields,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      application_id,
      embed,
    }),
  };
};
