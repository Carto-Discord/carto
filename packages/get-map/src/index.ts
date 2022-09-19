import type { GetItemCommandOutput } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyResult } from "aws-lambda";
import type { EmbedField } from "discord.js";

type Event = {
  application_id: string;
  channel: GetItemCommandOutput;
  map: GetItemCommandOutput;
  token: string;
};

const SUCCESS_TITLE = "Retrieved map";

export const handler = async ({
  application_id,
  channel,
  map,
  token,
}: Event): Promise<APIGatewayProxyResult> => {
  const tokens = map.Item?.tokens?.L || [];
  const fields: EmbedField[] = tokens.map(({ M: token }, i) => ({
    name: token?.name.S || `token ${i}`,
    value: `${token?.column.S?.toUpperCase()}${token?.row.N}`,
    inline: true,
  }));

  const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.MAPS_BUCKET}/${channel.Item?.id.S}/${map.Item?.id.S}.png`;

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
