import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";

type CreateProps = {
  url: string;
  rows: number;
  columns: number;
  channelId: string;
};

type CreateResponse = {
  success: boolean;
  body: string;
};

type ResponseData = {
  created: string;
  blob?: string;
  bucket?: string;
  message?: string;
};

export const createMap = async ({
  url,
  rows,
  columns,
  channelId,
}: CreateProps): Promise<CreateResponse> => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;

  const client = await createAuthenticatedClient(triggerUrl);

  try {
    const response = await client.request({
      url: triggerUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "create",
        url,
        rows,
        columns,
        channelId,
      },
    });

    const body = response.data as ResponseData;

    const { blob, bucket } = body;
    const tempFile = await downloadBlob({ blob, bucket });

    return {
      success: true,
      body: tempFile,
    };
  } catch (error) {
    console.warn(
      `Non-ok response received.\n Status: ${error.status}\n Message: ${error.data.message}`
    );

    if (error.status < 500) {
      return {
        success: false,
        body: error.data.message,
      };
    } else {
      return {
        success: false,
        body:
          "A server error occured. Please raise a GitHub issue detailing the problem.",
      };
    }
  }
};
