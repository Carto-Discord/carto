import { getLambdaInvokeUrl, generateSignature } from "../support";

describe("Client Ping", () => {
  let url: string;

  beforeEach(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);
  });

  it("should respond with Pong", () => {
    const body = { type: 1 };
    const timestamp = Date.now();

    const headers = {
      "x-signature-ed25519": generateSignature(
        JSON.stringify(body),
        timestamp.toString()
      ),
      "x-signature-timestamp": timestamp,
    };

    cy.request({
      method: "POST",
      url,
      body,
      headers,
    })
      .its("body")
      .its("type")
      .should("eq", 1);
  });
});
