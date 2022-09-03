/// <reference types="cypress" />

import nacl from "tweetnacl";
import { Command } from "./types";

export * from "./aws";

beforeEach(() => {
  cy.visit("/");
});

export const generateSignature = (body: string, timestamp: string) => {
  const secretKey = Buffer.from(Cypress.env("PRIVATE_KEY"), "hex");
  const messageBuffer = Buffer.from(timestamp + body);
  return Buffer.from(
    nacl.sign(messageBuffer, secretKey).slice(0, nacl.sign.signatureLength)
  ).toString("hex");
};

export const generateHeaders = (command: Command) => {
  const timestamp = Date.now();

  return {
    "Content-Type": "application/json",
    "x-signature-ed25519": generateSignature(
      JSON.stringify(command),
      timestamp.toString()
    ),
    "x-signature-timestamp": timestamp,
  };
};

export { Command };
