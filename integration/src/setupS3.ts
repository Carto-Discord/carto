import fs from "fs";
import { resolve } from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const AWSConfig = {
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
  forcePathStyle: true,
};

const uuids = [
  "bfa6769a-25bd-4445-b4a2-69b0bf63ea9d",
  "140a5f22-ccfd-425c-9bfa-c69180729c59",
  "a3ea9734-0411-481f-9158-c7d54cdc61fb",
  "da6365bb-6953-4e10-9cc3-3235f0beb9a7",
  "dc09f4a8-bcee-4ba4-894a-8d42f21262eb",
  "367bbdb0-1081-49d0-8049-a8a1a838f9cc",
  "92bd55f1-b161-4c66-a00d-3c05e9d384b5",
  "5dfcafbc-0901-4114-91d2-06d64b843843",
  "b8552890-9f85-491f-bd2f-258b8f1c421b",
  "482d01d3-67f2-46d2-9c78-3bef8618f39a",
];

export const uploadToS3 = async (fileContent: Buffer, id: string) => {
  const client = new S3Client(AWSConfig);

  const command = new PutObjectCommand({
    Bucket: process.env.CYPRESS_MAP_BUCKET,
    Key: id,
    Body: fileContent,
    ContentType: "image/png",
    ContentEncoding: "base64",
  });

  await client.send(command);
};

export const deleteObject = (id: string) => {
  const client = new S3Client(AWSConfig);
  const command = new DeleteObjectCommand({
    Bucket: process.env.CYPRESS_MAP_BUCKET,
    Key: id,
  });

  return client.send(command);
};

const baseMapId = uuids[0];
const currentMapId = uuids[1];
const previousMapId = uuids[2];

const mapIds = [baseMapId, currentMapId, previousMapId];

mapIds.forEach(async (id, i) => {
  const content = fs.readFileSync(
    resolve(__dirname, `assets/test-map-${i + 1}.png`)
  );

  await uploadToS3(content, `${id}.png`);
});
