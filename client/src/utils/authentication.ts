import { GoogleAuth } from "google-auth-library";

export const createAuthenticatedClient = async (triggerUrl: string) => {
  const auth = new GoogleAuth();

  return await auth.getIdTokenClient(triggerUrl);
};
