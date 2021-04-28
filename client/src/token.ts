import { createAuthenticatedClient } from "./authentication";
import { downloadBlob } from "./storage";

type AddProps = {
  name: string;
  row: number;
  column: string;
  size?: string;
  condition?: string;
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
  channelId,
}: AddProps): Promise<TokenResponse> => {
  const triggerUrl = process.env.HTTP_TRIGGER_URL;

  try {
    const client = await createAuthenticatedClient(triggerUrl);
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
        channelId,
      },
    });

    const body = response.data as ResponseData;
    if (response.status === 201) {
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
  } catch (e) {
    console.warn(e);
  }
};
