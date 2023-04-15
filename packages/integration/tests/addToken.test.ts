import axios from "axios";
import type { EmbedData } from "discord.js";

import { baseMapId, currentMapId, previousMapId } from "./fixtures/maps.json";
import { existingChannel, newExistingChannel } from "./fixtures/channels.json";
import {
  getLambdaInvokeUrl,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
  getDocument,
  getObject,
  Command,
  generateHeaders,
  CartoMap,
  DiscordChannel,
  getExecutionOutput,
  getStateMachineName,
} from "./support";

describe("Add Token", () => {
  let url: string;

  const token = "mockToken";
  const application_id = "mockApplicationId";
  let stateMachineName = "";

  const channelContents = [
    {
      id: existingChannel,
      baseMap: baseMapId,
      currentMap: currentMapId,
      history: [previousMapId],
    },
    {
      id: newExistingChannel,
      baseMap: baseMapId,
      currentMap: baseMapId,
      history: [],
    },
  ];

  const mapContents = [
    {
      id: baseMapId,
      columns: 40,
      rows: 40,
      margin: { x: 55, y: 55 },
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: currentMapId,
      tokens: [
        {
          color: "Blue",
          column: "C",
          name: "Alvyn",
          row: 7,
          size: 1,
        },
      ],
    },
    {
      id: previousMapId,
      tokens: [
        {
          color: "Blue",
          column: "D",
          name: "Alvyn",
          row: 6,
          size: 1,
        },
      ],
    },
  ];

  const addBody: Command = {
    type: 2,
    channel_id: existingChannel,
    token,
    application_id,
    data: {
      options: [
        {
          name: "add",
          options: [
            {
              name: "name",
              value: "Sam",
            },
            {
              name: "row",
              value: 4,
            },
            {
              name: "column",
              value: "E",
            },
            {
              name: "size",
              value: 1,
            },
            {
              name: "color",
              value: "purple",
            },
          ],
        },
      ],
      name: "token",
      id: "token-id",
    },
  };

  beforeAll(async () => {
    const name = await getStateMachineName();

    if (!name) throw new Error("No state machine found for this run");

    stateMachineName = name;
  });

  beforeEach(async () => {
    url = (await getLambdaInvokeUrl()) ?? "";

    await teardownDynamoDB();

    await initialiseDynamoDB({
      table: Table.CHANNELS,
      contents: channelContents,
    });

    await initialiseDynamoDB({
      table: Table.MAPS,
      contents: mapContents,
    });
  });

  it("should add a new map with new tokens and specified optional properties", async () => {
    const headers = generateHeaders(addBody);

    const response = await axios.post(url, addBody, {
      headers,
    });

    expect(response.status).toEqual(200);

    const { output } = await getExecutionOutput(stateMachineName);

    if (!output) throw new Error("No output from execution");

    const embeds = JSON.parse(output) as EmbedData[];

    const embed = embeds[0];
    const newImageId =
      embed.image?.url.replace(/^.*[\\/]/, "").split(".")[0] ?? "";

    expect(embed.image?.url).toEqual(
      `https://s3.eu-central-1.amazonaws.com/${process.env.MAP_BUCKET}/${existingChannel}/${newImageId}.png`
    );
    expect(embed.title).toEqual("Token added");
    expect(embed.description).toEqual("Token positions:");

    expect(embed.fields).toHaveLength(2);
    expect(embed.fields?.[0].inline).toBe(true);
    expect(embed.fields?.[0].name).toEqual("Alvyn");
    expect(embed.fields?.[0].value).toEqual("C7");
    expect(embed.fields?.[1].inline).toBe(true);
    expect(embed.fields?.[1].name).toEqual("Sam");
    expect(embed.fields?.[1].value).toEqual("E4");

    expect(embed.type).toEqual("rich");

    // Inspect S3 bucket
    const s3Object = await getObject(`${existingChannel}/${newImageId}.png`);

    expect(s3Object.Body).toBeDefined();

    // Inspect Channel document

    const channelDocument = await getDocument({
      table: Table.CHANNELS,
      key: {
        id: existingChannel,
      },
    });

    const { baseMap, currentMap, history } =
      channelDocument.Item as DiscordChannel;

    expect(baseMap).toEqual(baseMapId);
    expect(currentMap).toEqual(newImageId);
    expect(history).toHaveLength(2);

    // Inspect Map document
    const mapDocument = await getDocument({
      table: Table.MAPS,
      key: {
        id: newImageId,
      },
    });

    const { tokens } = mapDocument.Item as CartoMap;

    expect(tokens).toHaveLength(2);
    expect(tokens[0].color).toEqual("Blue");
    expect(tokens[0].column).toEqual("C");
    expect(tokens[0].name).toEqual("Alvyn");
    expect(tokens[0].row).toEqual(7);
    expect(tokens[0].size).toEqual(1);

    expect(tokens[1].color).toEqual(expect.any(String));
    expect(tokens[1].column).toEqual("E");
    expect(tokens[1].name).toEqual("Sam");
    expect(tokens[1].row).toEqual(4);
    expect(tokens[1].size).toEqual(1);
  }, 30_000);

  it("should add a new map with new tokens and no optional properties", async () => {
    const optionalBody = {
      ...addBody,
      data: {
        options: [
          {
            name: "add",
            options: [
              {
                name: "name",
                value: "Sam",
              },
              {
                name: "row",
                value: 4,
              },
              {
                name: "column",
                value: "E",
              },
            ],
          },
        ],
        name: "token",
        id: "token-id",
      },
    };

    const headers = generateHeaders(optionalBody);

    const response = await axios.post(url, optionalBody, {
      headers,
    });

    expect(response.status).toBe(200);

    const { output } = await getExecutionOutput(stateMachineName);

    if (!output) throw new Error("No output from execution");

    const embeds = JSON.parse(output) as EmbedData[];

    const embed = embeds[0];
    const newImageId =
      embed.image?.url.replace(/^.*[\\/]/, "").split(".")[0] ?? "";

    expect(embed.image?.url).toEqual(
      `https://s3.eu-central-1.amazonaws.com/${process.env.MAP_BUCKET}/${existingChannel}/${newImageId}.png`
    );
    expect(embed.title).toEqual("Token added");
    expect(embed.description).toEqual("Token positions:");

    expect(embed.fields).toHaveLength(2);
    expect(embed.fields?.[0].inline).toBe(true);
    expect(embed.fields?.[0].name).toEqual("Alvyn");
    expect(embed.fields?.[0].value).toEqual("C7");
    expect(embed.fields?.[1].inline).toBe(true);
    expect(embed.fields?.[1].name).toEqual("Sam");
    expect(embed.fields?.[1].value).toEqual("E4");

    expect(embed.type).toEqual("rich");

    const s3Object = await getObject(`${existingChannel}/${newImageId}.png`);

    expect(s3Object.Body).toBeDefined();

    // Inspect Channel document

    const channelDocument = await getDocument({
      table: Table.CHANNELS,
      key: {
        id: existingChannel,
      },
    });

    const { baseMap, currentMap, history } =
      channelDocument.Item as DiscordChannel;

    expect(baseMap).toEqual(baseMapId);
    expect(currentMap).toEqual(newImageId);
    expect(history).toHaveLength(2);

    // Inspect Map document

    const mapDocument = await getDocument({
      table: Table.MAPS,
      key: {
        id: newImageId,
      },
    });

    const { tokens } = mapDocument.Item as CartoMap;

    expect(tokens).toHaveLength(2);
    expect(tokens[0].color).toEqual("Blue");
    expect(tokens[0].column).toEqual("C");
    expect(tokens[0].name).toEqual("Alvyn");
    expect(tokens[0].row).toEqual(7);
    expect(tokens[0].size).toEqual(1);

    expect(tokens[1].color).toEqual(expect.any(String));
    expect(tokens[1].column).toEqual("E");
    expect(tokens[1].name).toEqual("Sam");
    expect(tokens[1].row).toEqual(4);
    expect(tokens[1].size).toEqual(1);
  }, 30_000);

  it("should add a new map with new tokens and no existing tokens", async () => {
    const noTokensBody = {
      ...addBody,
      channel_id: newExistingChannel,
      data: {
        options: [
          {
            name: "add",
            options: [
              {
                name: "name",
                value: "Sam",
              },
              {
                name: "row",
                value: 4,
              },
              {
                name: "column",
                value: "E",
              },
            ],
          },
        ],
        name: "token",
        id: "token-id",
      },
    };

    const headers = generateHeaders(noTokensBody);

    const response = await axios.post(url, noTokensBody, {
      headers,
    });

    expect(response.status).toBe(200);

    const { output } = await getExecutionOutput(stateMachineName);

    if (!output) throw new Error("No output from execution");

    const embeds = JSON.parse(output) as EmbedData[];

    const embed = embeds[0];
    const newImageId =
      embed.image?.url.replace(/^.*[\\/]/, "").split(".")[0] ?? "";

    expect(embed.image?.url).toEqual(
      `https://s3.eu-central-1.amazonaws.com/${process.env.MAP_BUCKET}/${newExistingChannel}/${newImageId}.png`
    );
    expect(embed.title).toEqual("Token added");
    expect(embed.description).toEqual("Token positions:");

    expect(embed.fields).toHaveLength(1);
    expect(embed.fields?.[0].inline).toBe(true);
    expect(embed.fields?.[0].name).toEqual("Sam");
    expect(embed.fields?.[0].value).toEqual("E4");

    expect(embed.type).toEqual("rich");

    // Inspect S3 bucket
    const s3Object = await getObject(`${newExistingChannel}/${newImageId}.png`);

    expect(s3Object.Body).toBeDefined();

    // Inspect Channel document
    const channelDocument = await getDocument({
      table: Table.CHANNELS,
      key: {
        id: newExistingChannel,
      },
    });
    const { baseMap, currentMap, history } =
      channelDocument.Item as DiscordChannel;

    expect(baseMap).toEqual(baseMapId);
    expect(currentMap).toEqual(newImageId);
    expect(history).toHaveLength(1);

    // Inspect Map document
    const mapDocument = await getDocument({
      table: Table.MAPS,
      key: {
        id: newImageId,
      },
    });
    const { tokens } = mapDocument.Item as CartoMap;

    expect(tokens).toHaveLength(1);

    expect(tokens[0].color).toEqual(expect.any(String));
    expect(tokens[0].column).toEqual("E");
    expect(tokens[0].name).toEqual("Sam");
    expect(tokens[0].row).toEqual(4);
    expect(tokens[0].size).toEqual(1);
  }, 30_000);

  describe("given an invalid location is provided", () => {
    it("should not add a new map and return an error", async () => {
      const body = {
        ...addBody,
        data: {
          options: [
            {
              name: "add",
              options: [
                {
                  name: "name",
                  value: "New Token",
                },
                {
                  name: "row",
                  value: 41,
                },
                {
                  name: "column",
                  value: "A",
                },
              ],
            },
          ],
          name: "token",
          id: "token-id",
        },
      };

      const headers = generateHeaders(body);

      const response = await axios.post(url, body, {
        headers,
      });

      expect(response.status).toBe(200);

      const { output } = await getExecutionOutput(stateMachineName);

      if (!output) throw new Error("No output from execution");

      const embeds = JSON.parse(output) as EmbedData[];

      const embed = embeds[0];

      expect(embed.title).toEqual("Token Add error");
      expect(embed.description).toEqual(
        "The row or column you entered is out of bounds.\nThis map's bounds are 40 rows by 40 columns"
      );

      expect(embed.fields).toBeUndefined();

      expect(embed.type).toEqual("rich");

      // Inspect Channel document
      const channelDocument = await getDocument({
        table: Table.CHANNELS,
        key: {
          id: existingChannel,
        },
      });

      const { history } = channelDocument.Item as DiscordChannel;

      // Check length is still the same
      expect(history).toHaveLength(1);
    }, 30_000);
  });

  describe("given a token with the same name as an existing one is added", () => {
    it("should not add a new map and return an error", async () => {
      const body = {
        ...addBody,
        data: {
          options: [
            {
              name: "add",
              options: [
                {
                  name: "name",
                  value: "Alvyn",
                },
                {
                  name: "row",
                  value: 1,
                },
                {
                  name: "column",
                  value: "A",
                },
              ],
            },
          ],
          name: "token",
          id: "token-id",
        },
      };

      const headers = generateHeaders(body);

      const response = await axios.post(url, body, {
        headers,
      });

      expect(response.status).toBe(200);

      const { output } = await getExecutionOutput(stateMachineName);

      if (!output) throw new Error("No output from execution");

      const embeds = JSON.parse(output) as EmbedData[];

      const embed = embeds[0];

      expect(embed.title).toEqual("Token Add error");
      expect(embed.description).toEqual(
        "A token called Alvyn already exists on the map. \nMove it with `/token move` or remove it with `/token delete`"
      );

      expect(embed.fields).toBeUndefined();

      expect(embed.type).toEqual("rich");
      // Inspect Channel document
      const channelDocument = await getDocument({
        table: Table.CHANNELS,
        key: {
          id: existingChannel,
        },
      });
      const { history } = channelDocument.Item as DiscordChannel;

      // Check length is still the same
      expect(history).toHaveLength(1);
    }, 30_000);
  });
});
