import fetch from "node-fetch";
import { Storage } from "@google-cloud/storage";
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

export const createMap = async ({
  url,
  rows,
  columns,
}: CreateProps): Promise<CreateResponse> => {
  const storage = new Storage();

  const response = await fetch(process.env.HTTP_TRIGGER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create",
      url,
      rows,
      columns,
    }),
  });

  const body = await response.json();
  if (response.ok) {
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
