/// <reference types="cypress" />

import "cypress-promise/register";
import nacl from "tweetnacl";

export * from "./aws";

export const generateSignature = (body: string, timestamp: string) => {
  const secretKey = Buffer.from(Cypress.env("PRIVATE_KEY"), "hex");
  const messageBuffer = Buffer.from(timestamp + body);
  return Buffer.from(
    nacl.sign(messageBuffer, secretKey).slice(0, nacl.sign.signatureLength)
  ).toString("hex");
};
