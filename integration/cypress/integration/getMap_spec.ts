import { v4 as uuid } from "uuid";

import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  Table,
  uploadToS3,
} from "../support";

describe("Get Map", () => {
  let url: string;

  const baseMapId = uuid();
  const currentMapId = uuid();
  const previousMapId = uuid();

  const channelId = "123456789012345678";
  const channelContents = [
    {
      id: channelId,
      base: baseMapId,
      current: currentMapId,
      history: [previousMapId],
    },
  ];

  const mapContents = [
    {
      id: baseMapId,
      columns: 40,
      margin_x: 55,
      margin_y: 55,
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: currentMapId,
      tokens: [
        {
          colour: "Blue",
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
          colour: "Blue",
          column: "D",
          name: "Alvyn",
          row: 6,
          size: 1,
        },
      ],
    },
  ];

  beforeEach(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);
  });

  describe("given the channel has an associated map", () => {
    beforeEach(async () => {
      await initialiseDynamoDB({
        table: Table.CHANNELS,
        contents: channelContents,
      });

      await initialiseDynamoDB({
        table: Table.MAPS,
        contents: mapContents,
      });

      let index = 1;

      for (const id of [baseMapId, currentMapId, previousMapId]) {
        await uploadToS3(`cypress/fixtures/test-map-${index++}.png`, id);
      }
    });

    it("should retrieve map data", () => {
      const body = {
        type: 2,
        channel_id: channelId,
        token: "fake-discord-token",
        application_id: "parent-application-id",
        data: {
          options: [
            {
              name: "get",
            },
          ],
          name: "map",
          id: "map-id",
        },
      };
      const timestamp = Date.now();

      const headers = {
        "x-signature-ed25519": generateSignature(
          JSON.stringify(body),
          timestamp.toString()
        ),
        "x-signature-timestamp": timestamp,
      };

      cy.intercept({
        url: `https://discord.com/api/v9/webhooks/${body.application_id}/${body.token}/messages/@original`,
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      }).as("webhook");

      // Send the request and wait for the deferred response
      cy.request({
        method: "POST",
        url,
        body,
        headers,
      })
        .its("body")
        .its("type")
        .should("eq", 5);

      // Wait for a response from the API
      cy.wait("@webhook", { timeout: 30000 })
        .its("request.body")
        .should("eq", {
          embeds: [{ name: "Alvyn", value: "C7", inline: true }],
        });
    });
  });
});
