import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";
import { AWSConfig } from "./common";

export const listObjects = () => {
  const client = new S3Client({ ...AWSConfig, forcePathStyle: true });
  const command = new ListObjectsCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
  });

  return client.send(command);
};
