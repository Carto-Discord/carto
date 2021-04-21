import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";

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
  const triggerUrl = process.env.HTTP_TRIGGER_URL;

  const client = await createAuthenticatedClient(triggerUrl);
  const response = await client.request({
    url: triggerUrl,
    method: "GET",
    params: { channelId },
  });

  const body = response.data as ResponseData;
  if (response.status === 200) {
    const { blob, bucket } = body;
    const tempFile = await downloadBlob({ blob, bucket });

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
