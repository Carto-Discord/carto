import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { AWSConfig } from "./common";

const config = { ...AWSConfig, forcePathStyle: true };

export const uploadToS3 = async (filePath: string, id: string) => {
  const client = new S3Client(config);

  await cy
    .readFile(filePath, "binary")
    .then(
      (fileContent) =>
        new PutObjectCommand({
          Bucket: Cypress.env("MAP_BUCKET"),
          Key: id,
          Body: fileContent,
        })
    )
    .then((command) => client.send(command))
    .promisify();
};

export const deleteObject = (id: string) => {
  const client = new S3Client(config);
  const command = new DeleteObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key: id,
  });

  return client.send(command);
};
