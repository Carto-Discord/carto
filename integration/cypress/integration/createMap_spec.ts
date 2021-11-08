import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  teardownDynamoDB,
  listObjects,
  getDocument,
  Table,
} from "../support";
import { CartoBaseMap, DiscordChannel } from "../support/aws/types";

describe("Create Map", () => {
  let url: string;

  const channelId = "123456789012345678";
  const token = "mockToken";
  const applicationId = "mockApplicationId";

  const channelContents = [
    {
      id: channelId,
      baseMap: baseMapId,
      currentMap: currentMapId,
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

  describe("given the channel has no associated map", () => {
    describe("given the Client is called", () => {
      it("should return a deferred response", () => {
        const body = {
          type: 2,
          channel_id: channelId,
          token,
          application_id: applicationId,
          data: {
            options: [
              {
                name: "create",
                options: [
                  {
                    name: "url",
                    value: "https://i.redd.it/hfoxphcnnix61.jpg",
                  },
                  {
                    name: "rows",
                    value: 6,
                  },
                  {
                    name: "columns",
                    value: 9,
                  },
                ],
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
    });

    describe("given the API is called", () => {
      beforeEach(async () => {
        await initialiseDynamoDB({
          table: Table.CHANNELS,
          contents: channelContents,
        });

        await initialiseDynamoDB({
          table: Table.MAPS,
          contents: mapContents,
        });
      });

      afterEach(async () => {
        await teardownDynamoDB();
      });

      describe("given the channel ID is valid", () => {
        it("should create a map and overwrite the existing map config", () => {
          let newImageId: string;
          const mapUrl = "https://i.redd.it/hfoxphcnnix61.jpg";

          cy.request({
            method: "POST",
            url: `http://localhost:8080/map/${channelId}`,
            body: {
              applicationId,
              columns: 6,
              rows: 9,
              token,
              url: mapUrl,
            },
          })
            // Inspect response
            .then((response) => {
              expect(response.body.url).to.eq(
                `https://discord.com/api/v9/webhooks/${applicationId}/${token}/messages/@original`
              );
              const embed = response.body.json.embeds[0];
              newImageId = embed.image.url
                .replace(/^.*[\\\/]/, "")
                .split(".")[0];

              expect(embed.image.url).to.eq(
                `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
              );
              expect(embed.title).to.eq("Map created");

              expect(embed.fields).to.have.length(2);
              expect(embed.fields[0].inline).to.be.true;
              expect(embed.fields[0].name).to.eq("Rows");
              expect(embed.fields[0].value).to.eq("9");
              expect(embed.fields[1].inline).to.be.true;
              expect(embed.fields[1].name).to.eq("Columns");
              expect(embed.fields[1].value).to.eq("6");

              expect(embed.type).to.eq("rich");
            })
            // Inspect S3 bucket
            .then(() => listObjects())
            .then(({ Contents }) => {
              expect(Contents).to.have.length(4);
              expect(Contents.map(({ Key }) => Key)).to.include(
                `${newImageId}.png`
              );
            })
            // Inspect Channel document
            .then(() =>
              getDocument({
                table: Table.CHANNELS,
                key: {
                  id: channelId,
                },
              })
            )
            .then(({ Item }) => {
              const { baseMap, currentMap, history } = Item as DiscordChannel;
              expect(baseMap).to.eq(currentMap);
              expect(baseMap).not.to.eq(baseMapId);
              expect(currentMap).not.to.eq(currentMapId);

              expect(history).to.have.length(2);
              expect(history).to.include(previousMapId);
              expect(history).to.include(currentMapId);
            })
            // Inspect Map document
            .then(() =>
              getDocument({ table: Table.MAPS, key: { id: newImageId } })
            )
            .then(({ Item }) => {
              const { columns, rows, url } = Item as CartoBaseMap;

              expect(columns).to.eq(6);
              expect(rows).to.eq(9);
              expect(url).to.eq(mapUrl);
            });
        });
      });
    });
  });
});
