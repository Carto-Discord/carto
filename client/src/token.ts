import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";

type AddProps = {
  name: string;
  row: number;
  column: string;
  size?: string;
  condition?: string;
  colour?: string;
  channelId: string;
};

type TokenResponse = {
  success: boolean;
  body: string;
};

type ResponseData = {
  created: string;
  blob?: string;
  bucket?: string;
  message?: string;
};

export const addToken = async ({
  name,
  row,
  column,
  size = "MEDIUM",
  condition,
  colour,
  channelId,
}: AddProps): Promise<TokenResponse> => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;

  const client = await createAuthenticatedClient(triggerUrl);

  try {
    const response = await client.request({
      url: triggerUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        action: "addToken",
        name,
        row,
        column,
        size,
        condition,
        colour,
        channelId,
      },
    });

    const { blob, bucket } = response.data as ResponseData;
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
