import { GaxiosPromise } from "gaxios";
import { downloadBlob } from "./storage";

type ResponseData = {
  created: string;
  blob?: string;
  bucket?: string;
  message?: string;
};

type TokenResponse = {
  success: boolean;
  body: string;
};

export const handleRequest = async (
  request: () => GaxiosPromise<ResponseData>
): Promise<TokenResponse> => {
  try {
    const response = await request();

    const { blob, bucket } = response.data as ResponseData;
    const tempFile = await downloadBlob({ blob, bucket });

    return {
      success: true,
      body: tempFile,
    };
  } catch (error) {
    console.warn(
      `Non-ok response received.\n Status: ${
        error.response.status
      }\n Data: ${JSON.stringify(error.response.data)}`
    );

    if (error.response.status < 500) {
      return {
        success: false,
        body: error.response.data.message,
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
