import { APIGatewayProxyEvent } from "aws-lambda";
import nacl from "tweetnacl";
import { validateRequest } from "../src/validation";

jest.mock("tweetnacl");

const mockVerify = nacl.sign.detached.verify as jest.MockedFunction<
  typeof nacl.sign.detached.verify
>;

describe("Validation", () => {
  mockVerify.mockReturnValue(true);

  beforeEach(() => {
    process.env.PUBLIC_KEY = "public key";
  });

  it("should verify the request", () => {
    const body = JSON.stringify({
      data: true,
    });

    const mockEvent = {
      headers: {
        "x-signature-ed25519": "signature",
        "x-signature-timestamp": "timestamp",
      },
      body,
    } as unknown as APIGatewayProxyEvent;

    const result = validateRequest(mockEvent);

    expect(mockVerify).toBeCalledWith(
      Buffer.from("timestamp" + body),
      Buffer.from("signature", "hex"),
      Buffer.from("public key", "hex")
    );
    expect(result).toBe(true);
  });
});
