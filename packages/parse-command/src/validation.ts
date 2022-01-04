import { APIGatewayProxyEvent } from "aws-lambda";
import nacl from "tweetnacl";

export const validateRequest = (event: APIGatewayProxyEvent) => {
  console.log("Validate: ", event);

  const publicKey = process.env.PUBLIC_KEY;
  const signature = event.headers["x-signature-ed25519"];
  const timestamp = event.headers["x-signature-timestamp"];
  const { body } = event;

  console.log({ publicKey, signature, timestamp, body });

  if (!publicKey || !signature || !timestamp || !body) return false;

  return nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );
};
