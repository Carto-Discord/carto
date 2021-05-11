import { Storage } from "@google-cloud/storage";

export const getPublicUrl = (fileName: string) => {
  const storage = new Storage();
  const bucket = storage.bucket(process.env.MAP_BUCKET);
  const file = bucket.file(fileName);

  return file.publicUrl();
};
