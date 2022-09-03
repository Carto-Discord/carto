import { APIGatewayProxyEventV2 } from "aws-lambda";
import { validateRequest } from "../src/validation";

describe("Validation", () => {
  beforeEach(() => {
    process.env.PUBLIC_KEY =
      "a58293d7fa04d53ab90108be275a87fe890eece595962273a93e1f87d398df74";
  });

  it("should verify the request", () => {
    const body = JSON.stringify({ type: 1 });

    const mockEvent = {
      headers: {
        "X-Signature-Ed25519":
          "71c8a6014b34c1c9812587079e770711a518c133c64511640ee0d757c4f6b4f28a9771cc18e40b8bf141bcebe6414380d6062ca095f22dd863b9f7e85e5ebf06",
        "X-Signature-Timestamp": "1662218997328",
      },
      body,
    } as unknown as APIGatewayProxyEventV2;

    const result = validateRequest(mockEvent);

    expect(result).toBe(true);
  });
});
