import fs from "fs";
import { resolve } from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import {
  existingChannel,
  newExistingChannel,
} from "../cypress/fixtures/channels.json";

const AWSConfig = {
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
  forcePathStyle: true,
};

const ids = [
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

const content = fs.readFileSync(resolve(__dirname, `assets/test-map.png`));

ids.forEach(async (id) => {
  await uploadToS3(content, `${existingChannel}/${id}.png`);
  await uploadToS3(content, `${newExistingChannel}/${id}.png`);
});
