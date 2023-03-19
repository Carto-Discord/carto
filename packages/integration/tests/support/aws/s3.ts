import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { AWSConfig } from "./common";

const client = new S3Client({ ...AWSConfig, forcePathStyle: true });

export const listObjects = () => {
  const command = new ListObjectsCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
  });

  return client.send(command);
};

export const getObject = (Key: string) => {
  const command = new GetObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key,
  });

  return client.send(command);
};

export const putObject = (fileContent: string, id: string) => {
  const command = new PutObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key: id,
    Body: fileContent,
    ContentType: "image/png",
    ContentEncoding: "base64",
  });

  return client.send(command);
};

export const putObjects = (fileContent: string, id: string) => {
  const command = new PutObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key: id,
    Body: fileContent,
    ContentType: "image/png",
    ContentEncoding: "base64",
  });

  return client.send(command);
};

export const deleteObject = (id: string) => {
  const command = new DeleteObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key: id,
  });

  return client.send(command);
};

export const deleteObjects = (ids: string[]) => {
  if (!ids.length) return;

  const command = new DeleteObjectsCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Delete: {
      Objects: ids.map((id) => ({ Key: id })),
    },
  });

  return client.send(command);
};
