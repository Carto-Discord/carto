import { Storage } from "@google-cloud/storage";

type BlobProps = {
  blob: string;
  bucket: string;
};

export const downloadBlob = async ({ blob, bucket }: BlobProps) => {
  const storage = new Storage();

  const tempFile = `/tmp/${blob}`;
  await storage.bucket(bucket).file(blob).download({ destination: tempFile });

  console.log(`gs://${bucket}/${blob} downloaded to ${tempFile}.`);

  return tempFile;
};
