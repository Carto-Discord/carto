import { APIGatewayProxyEvent } from "aws-lambda";
import nacl from "tweetnacl";

export const validateRequest = (event: APIGatewayProxyEvent) => {
  const publicKey = process.env.PUBLIC_KEY;
  const signature = event.headers["X-Signature-Ed25519"];
  const timestamp = event.headers["X-Signature-Timestamp"];
  const { body } = event;

  return nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );
};
