import fs from "fs";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { AWSConfig } from "./common";

export const uploadToS3 = (filePath: string, id: string) => {
  const fileContent = fs.readFileSync(filePath);

  const client = new S3Client(AWSConfig);
  const command = new PutObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key: id,
    Body: fileContent,
  });

  return client.send(command);
};

export const deleteObject = (id: string) => {
  const client = new S3Client(AWSConfig);
  const command = new DeleteObjectCommand({
    Bucket: Cypress.env("MAP_BUCKET"),
    Key: id,
  });

  return client.send(command);
};
