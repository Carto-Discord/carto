import { APIGatewayProxyEvent, APIGatewayProxyEventHeaders } from "aws-lambda";
import nacl from "tweetnacl";

const getCaseInsensitive = (
  headers: APIGatewayProxyEventHeaders,
  key: string
) => {
  const correspondingKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );

  return correspondingKey ? headers[correspondingKey] : undefined;
};

export const validateRequest = (event: APIGatewayProxyEvent) => {
  const publicKey = process.env.PUBLIC_KEY;
  const signature = getCaseInsensitive(event.headers, "x-signature-ed25519");
  const timestamp = getCaseInsensitive(event.headers, "x-signature-timestamp");
  const { body } = event;

  if (!publicKey || !signature || !timestamp || !body) return false;

  return nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );
};
