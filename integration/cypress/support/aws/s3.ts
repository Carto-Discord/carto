import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { AWSConfig } from "./common";

export const listObjects = () => {
  const client = new S3Client({ ...AWSConfig, forcePathStyle: true });
  const command = new ListObjectsV2Command({
    Bucket: Cypress.env("MAP_BUCKET"),
  });

  return client.send(command);
};

export const getObject = (Key: string) => {
  const client = new S3Client({ ...AWSConfig, forcePathStyle: true });
  const command = new GetObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key,
  });

  return client.send(command);
};
