import { createAuthenticatedClient } from "./authentication";

jest.mock("google-auth-library", () => {
  return {
    GoogleAuth: jest.fn().mockImplementation(() => {
      return {
        getIdTokenClient: () => ({
          client: true,
        }),
      };
    }),
  };
});

describe("Authentication", () => {
  it("should return the client", async () => {
    expect(await createAuthenticatedClient("url")).toEqual({ client: true });
  });
});
