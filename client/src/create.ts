import { URL } from "url";
import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
import { GCS_BUCKET } from "./constants";

type CreateProps = {
  url: string;
  rows: number;
  columns: number;
};

type CreateResponse = {
  success: boolean;
  body: string;
};

type ResponseData = {
  created: string;
  fileName?: string;
  message?: string;
};

export const createMap = async ({
  url,
  rows,
  columns,
}: CreateProps): Promise<CreateResponse> => {
  const storage = new Storage();
  const auth = new GoogleAuth();
  const triggerUrl = process.env.HTTP_TRIGGER_URL;
  const targetAudience = new URL(triggerUrl).origin;

  console.log(
    `Requesting ${triggerUrl} with target audience ${targetAudience}`
  );

  const client = await auth.getIdTokenClient(triggerUrl);
  const response = await client.request({
    url: triggerUrl,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      url,
      rows,
      columns,
    }),
  });

  const body = response.data as ResponseData;
  if (response.status === 201) {
    const { fileName } = body;
    await storage
      .bucket(GCS_BUCKET)
      .file(fileName)
      .download({ destination: fileName });

    console.log(`gs://${GCS_BUCKET}/${fileName} downloaded to ${fileName}.`);

    return {
      success: true,
      body: fileName,
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
