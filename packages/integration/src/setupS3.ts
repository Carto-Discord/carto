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
  "sB4DTyyTaOcYQHst4VKwU",
  "DkYqcO4unB-GWnsUv10ZE",
  "SO9hNroDn2kIAaPP7vAx6",
  "AqB7KJME05pur-4W8yy2H",
  "JmKuYabVqxkCyhoJnxXAg",
  "NF7z_rkrlY7ak9C7mniSm",
  "KSaw1KH1dlqPQMl_6PTsH",
  "OC_fr9LFwJnkXQteXC1Kt",
  "Fl2h6LYHXtIBlPCLOmure",
  "MtmVYN6WguwLOO-3L0yds",
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
