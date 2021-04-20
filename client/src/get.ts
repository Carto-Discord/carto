import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";

type GetProps = {
  channelId: string;
};

type GetResponse = {
  success: boolean;
  body: string;
};

type ResponseData = {
  blob?: string;
  bucket?: string;
  message?: string;
};

export const getMap = async ({ channelId }: GetProps): Promise<GetResponse> => {
  const storage = new Storage();
  const auth = new GoogleAuth();
  const triggerUrl = process.env.HTTP_TRIGGER_URL;

  const client = await auth.getIdTokenClient(triggerUrl);
  const response = await client.request({
    url: triggerUrl,
    method: "GET",
    params: { channelId },
  });

  const body = response.data as ResponseData;
  if (response.status === 200) {
    const { blob, bucket } = body;
    const tempFile = `/tmp/${blob}`;
    await storage.bucket(bucket).file(blob).download({ destination: tempFile });

    console.log(`gs://${bucket}/${blob} downloaded to ${tempFile}.`);

    return {
      success: true,
      body: tempFile,
    };
  } else {
    console.warn(
      `Non-ok response received.\n Status: ${response.status}\n Message: ${body.message}`
    );

    return {
      success: false,
      body: body.message,
    };
  }
};
