import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";

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
  const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
  const getChannelItemCommand = new GetItemCommand({
    TableName: process.env.CHANNELS_TABLE,
    Key: { id: { S: channel_id } },
  });

  const channelItem = await dynamodbClient.send(getChannelItemCommand);
  const uuid = channelItem.Item?.currentMap?.S;

  if (!channelItem.Item || !uuid) {
    console.warn(`This channel has no map associated with it: ${channel_id}`);

    return {
      statusCode: 404,
      body: JSON.stringify({
        token,
        application_id,
        title: ERROR_TITLE,
        description: "This channel has no map associated with it",
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

    return {
      statusCode: 500,
      body: JSON.stringify({
        token,
        application_id,
        title: ERROR_TITLE,
        description: "Map data in incomplete, please report this to bot admins",
      }),
    };
  }

  const tokens = mapItem.Item.tokens?.L || [];
  const fields = tokens.map((token) => ({
    name: token.M?.name.S,
    value: `${token.M?.column.S?.toUpperCase()}${token.M?.row.N}`,
    inline: true,
  }));

  const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${uuid}.png`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      application_id,
      title: SUCCESS_TITLE,
      fields,
      image: { url },
    }),
  };
};