import { getLambdaInvokeUrl } from "../support";
import { validHeaders } from "../support/constants";

describe("Client Ping", () => {
  it("should respond with Pong", () => {
    getLambdaInvokeUrl().then((url) => {
      cy.log(`Client URL: ${url}`);

      cy.request({
        method: "POST",
        url,
        body: { type: 1 },
        headers: validHeaders,
      })
        .its("body")
        .its("type")
        .should("be", "1");
    });
  });
});
