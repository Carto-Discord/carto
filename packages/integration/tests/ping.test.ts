import axios from "axios";

import {
  getLambdaInvokeUrl,
  generateSignature,
  generateHeaders,
  Command,
} from "./support";

describe("Ping", () => {
  let url: string;
  const body: Command = { type: 1 };

  beforeAll(async () => {
    url = (await getLambdaInvokeUrl()) ?? "";
  });

  it("should respond with an invalid request signature", async () => {
    expect.assertions(2);

    const timestamp = Date.now();

    const headers = {
      "x-signature-ed25519": generateSignature(JSON.stringify(body), "1234"),
      "x-signature-timestamp": timestamp,
      "Content-Type": "application/json",
    };

    await axios
      .post(url, body, {
        headers,
      })
      .catch(({ response }) => {
        expect(response.status).toBe(401);
        expect(response.data).toEqual("invalid request signature");
      });
  });

  it("should respond with PONG", async () => {
    const headers = generateHeaders(body);

    const { data, status } = await axios.post(url, body, {
      headers,
    });

    expect(status).toBe(200);
    expect(data).toEqual({ type: 1 });
  });
});
