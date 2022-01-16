import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  initialiseDynamoDB,
  teardownDynamoDB,
  listObjects,
  getDocument,
  Table,
  Command,
  generateHeaders,
} from "../support";
import { CartoBaseMap, DiscordChannel } from "../support/aws/types";

describe("Create Map", () => {
  let url: string;
  let previousLength: number;

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
      margin: { x: 55, y: 55 },
      rows: 40,
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

  const mapUrl = "https://i.redd.it/hfoxphcnnix61.jpg";

  const body: Command = {
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
              value: mapUrl,
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

  before(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);
  });

  beforeEach(async () => {
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

  describe("given the channel has an associated map", () => {
    describe("given all data is valid", () => {
      it("should create a map and overwrite the existing map config", () => {
        let newImageId: string;

        const headers = generateHeaders(body);

        cy.request({
          method: "POST",
          url,
          body,
          headers,
        })
          .its("status")
          .should("eq", 200);

        cy.get("ul li", { timeout: 30000 })
          .then((item) => {
            const { params, body } = JSON.parse(item.text());
            expect(params).to.deep.equal({
              applicationId,
              token,
            });
            const embed = body.embeds[0];
            newImageId = embed.image.url.replace(/^.*[\\\/]/, "").split(".")[0];

            expect(embed.image.url).to.eq(
              `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
            );
            expect(embed.title).to.eq("Map created");

            expect(embed.fields).to.have.length(2);
            expect(embed.fields[0].inline).to.be.true;
            expect(embed.fields[0].name).to.eq("Rows");
            expect(embed.fields[0].value).to.eq(6);
            expect(embed.fields[1].inline).to.be.true;
            expect(embed.fields[1].name).to.eq("Columns");
            expect(embed.fields[1].value).to.eq(9);

            expect(embed.type).to.eq("rich");
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

            expect(columns).to.eq(9);
            expect(rows).to.eq(6);
            expect(url).to.eq(mapUrl);
          })
          // Inspect S3 bucket
          .then(() => listObjects())
          .then(({ Contents }) => {
            previousLength = Contents.length;
            expect(Contents.map(({ Key }) => Key)).to.include(
              `${newImageId}.png`
            );
          });
      });

      describe("given the url is invalid", () => {
        it("should respond with an error", () => {
          const badBody = {
            ...body,
            data: {
              options: [
                {
                  name: "create",
                  options: [
                    {
                      name: "url",
                      value: "bad.url",
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

          const headers = generateHeaders(badBody);

          cy.request({
            method: "POST",
            url,
            body: badBody,
            headers,
          })
            .its("status")
            .should("eq", 200);

          cy.get("ul li", { timeout: 30000 })
            .then((item) => {
              const { params, body } = JSON.parse(item.text());
              expect(params).to.deep.equal({
                applicationId,
                token,
              });
              const embed = body.embeds[0];

              expect(embed.title).to.eq("Map create error");
              expect(embed.description).to.include(
                "URL bad.url could not be found"
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
              // Make sure nothing has changed
              const { baseMap, currentMap, history } = Item as DiscordChannel;
              expect(baseMap).to.eq(baseMapId);
              expect(currentMap).to.eq(currentMapId);

              expect(history).to.have.length(1);
              expect(history).to.include(previousMapId);
            }) // Inspect S3 bucket
            .then(() => listObjects())
            .then(({ Contents }) => {
              // A new item should not have been created since
              // the last test
              expect(Contents).to.have.length(previousLength);
            });
        });
      });
    });
  });

  describe("given the channel has no associated map", () => {
    const newChannel = "123456789012345679";

    describe("given all data is valid", () => {
      it("should create a map and create a new map config", () => {
        let newImageId: string;

        const newBody = {
          ...body,
          channel_id: newChannel,
        };

        const headers = generateHeaders(newBody);

        cy.request({
          method: "POST",
          url,
          body: newBody,
          headers,
        })
          .its("status")
          .should("eq", 200);

        cy.get("ul li", { timeout: 30000 })
          .then((item) => {
            const { params, body } = JSON.parse(item.text());
            expect(params).to.deep.equal({
              applicationId,
              token,
            });
            const embed = body.embeds[0];
            newImageId = embed.image.url.replace(/^.*[\\\/]/, "").split(".")[0];

            expect(embed.image.url).to.eq(
              `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
            );
            expect(embed.title).to.eq("Map created");

            expect(embed.fields).to.have.length(2);
            expect(embed.fields[0].inline).to.be.true;
            expect(embed.fields[0].name).to.eq("Rows");
            expect(embed.fields[0].value).to.eq(6);
            expect(embed.fields[1].inline).to.be.true;
            expect(embed.fields[1].name).to.eq("Columns");
            expect(embed.fields[1].value).to.eq(9);

            expect(embed.type).to.eq("rich");
          })
          // Inspect Channel document
          .then(() =>
            getDocument({
              table: Table.CHANNELS,
              key: {
                id: newChannel,
              },
            })
          )
          .then(({ Item }) => {
            const { baseMap, currentMap, history } = Item as DiscordChannel;
            expect(baseMap).to.eq(newImageId);
            expect(currentMap).to.eq(newImageId);

            expect(history).to.have.length(0);
          })
          // Inspect Map document
          .then(() =>
            getDocument({ table: Table.MAPS, key: { id: newImageId } })
          )
          .then(({ Item }) => {
            const { columns, rows, url } = Item as CartoBaseMap;

            expect(columns).to.eq(9);
            expect(rows).to.eq(6);
            expect(url).to.eq(mapUrl);
          }) // Inspect S3 bucket
          .then(() => listObjects())
          .then(({ Contents }) => {
            // Including from the last test
            // expect(Contents).to.have.length(previousLength + 1);
            expect(Contents.map(({ Key }) => Key)).to.include(
              `${newImageId}.png`
            );
          });
      });
    });
  });
});
