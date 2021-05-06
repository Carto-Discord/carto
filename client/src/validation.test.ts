import { Request } from "express";
import nacl from "tweetnacl";
import { validateRequest } from "./validation";

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
    const mockRequest = {
      get: (header: string) => {
        if (header === "X-Signature-Ed25519") {
          return "signature";
        } else if (header === "X-Signature-Timestamp") {
          return "timestamp";
        } else {
          return "";
        }
      },
      body: {
        data: true,
      },
    } as Request;

    const result = validateRequest(mockRequest);

    expect(mockVerify).toBeCalledWith(
      Buffer.from(
        "timestamp" +
          JSON.stringify({
            data: true,
          })
      ),
      Buffer.from("signature", "hex"),
      Buffer.from("public key", "hex")
    );
    expect(result).toBe(true);
  });
});
