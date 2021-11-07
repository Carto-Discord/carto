import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
} from "../support";

describe("Get Map", () => {
  let url: string;

  const channelId = "123456789012345678";
  const token = "mockToken";
  const application_id = "mockApplicationId";

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

  before(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);
  });

  describe("given the channel has an associated map", () => {
    const mapIds = [baseMapId, currentMapId, previousMapId];

    before(async () => {
      await initialiseDynamoDB({
        table: Table.CHANNELS,
        contents: channelContents,
      });

      await initialiseDynamoDB({
        table: Table.MAPS,
        contents: mapContents,
      });
    });

    after(async () => {
      await teardownDynamoDB();
    });

    it("should return a deferred response from the client", () => {
      const body = {
        type: 2,
        channel_id: channelId,
        token,
        application_id,
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

      cy.request({
        method: "POST",
        url,
        body,
        headers,
      })
        .its("body")
        .its("type")
        .should("eq", 5);
    });

    describe("given the API is called", () => {
      describe("given the channel ID is valid", () => {
        it("should respond with the map image and details", () => {
          cy.request({
            method: "GET",
            url: `http://localhost:8080/map/${channelId}?applicationId=${application_id}&token=${token}`,
          }).then((response) => {
            expect(response.body.url).to.eq(
              `https://discord.com/api/v9/webhooks/${application_id}/${token}/messages/@original`
            );
            const embed = response.body.json.embeds[0];

            expect(embed.image.url).to.eq(
              `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${currentMapId}.png`
            );
            expect(embed.fields).to.have.length(1);
            expect(embed.fields[0].inline).to.be.true;
            expect(embed.fields[0].name).to.eq("Alvyn");
            expect(embed.fields[0].value).to.eq("C7");
            expect(embed.type).to.eq("rich");
            expect(embed.title).to.eq("Retrieved Map");
          });
        });
      });
    });
  });
});
