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
          "3a25f3db58760e73b1a0ac5163b331e23c81483177d819158a6c6514a54a3a0ad630fdb35b0bd110d6b701511f70cb28fa00fd417e8868341ce0f25d488b390b",
        "X-Signature-Timestamp": "1641309313810",
      },
      body,
    } as unknown as APIGatewayProxyEventV2;

    const result = validateRequest(mockEvent);

    expect(result).toBe(true);
  });
});
