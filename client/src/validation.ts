import { Request } from "express";
import nacl from "tweetnacl";

export const validateRequest = (req: Request) => {
  const publicKey = process.env.PUBLIC_KEY;
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  const body = JSON.stringify(req.body);

  return nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );
};
