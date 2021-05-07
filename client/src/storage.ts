import { Storage } from "@google-cloud/storage";

type BlobProps = {
  blob: string;
  bucket: string;
};

export const getBlobUrl = async ({ blob, bucket }: BlobProps) => {
  const storage = new Storage();

  return storage.bucket(bucket).file(blob).publicUrl();
};
