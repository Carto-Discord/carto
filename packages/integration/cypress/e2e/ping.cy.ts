import {
  getLambdaInvokeUrl,
  generateSignature,
  generateHeaders,
  Command,
} from "../support/e2e";

describe("Ping", () => {
  let url: string;

  before(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);
  });

  describe("given the signature is invalid", () => {
    it("should respond with a 401 status", () => {
      const body = { type: 1 };
      const timestamp = Date.now();

      const headers = {
        "x-signature-ed25519": generateSignature(JSON.stringify(body), "1234"),
        "x-signature-timestamp": timestamp,
      };

      cy.request({
        method: "POST",
        url,
        body,
        headers,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.eq("invalid request signature");
      });
    });
  });

  it("should respond with OK", () => {
    const body: Command = { type: 1 };

    const headers = generateHeaders(body);

    cy.request({
      method: "POST",
      url,
      body,
      headers,
    })
      .its("status")
      .should("eq", 200);
  });
});
