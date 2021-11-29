import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
  listObjects,
  getDocument,
} from "../support";
import { CartoMap, DiscordChannel } from "../support/aws/types";

describe("Tokens", () => {
  let url: string;

  const channelId = "123456789012345678";
  const token = "mockToken";
  const application_id = "mockApplicationId";

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

  beforeEach(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);

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

  describe("Add Token", () => {
    describe("given the Client is called", () => {
      it("should return a deferred response", () => {
        const body = {
          type: 2,
          channel_id: channelId,
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
                    value: "MEDIUM",
                  },
                  {
                    name: "colour",
                    value: "purple",
                  },
                ],
              },
            ],
            name: "token",
            id: "token-id",
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
      it("should add a new map with new tokens and default optional properties", () => {
        let newImageId: string;

        cy.request({
          method: "POST",
          url: `http://localhost:8080/token/${channelId}`,
          body: {
            applicationId: application_id,
            token,
            column: "A",
            name: "New Token",
            row: 1,
            size: "MEDIUM",
          },
        })
          .then((response) => {
            expect(response.body.url).to.eq(
              `https://discord.com/api/v9/webhooks/${application_id}/${token}/messages/@original`
            );
            const embed = response.body.json.embeds[0];
            newImageId = embed.image.url.replace(/^.*[\\\/]/, "").split(".")[0];

            expect(embed.image.url).to.eq(
              `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
            );
            expect(embed.title).to.eq("Tokens updated");
            expect(embed.description).to.eq("Token positions:");

            expect(embed.fields).to.have.length(2);
            expect(embed.fields[0].inline).to.be.true;
            expect(embed.fields[0].name).to.eq("Alvyn");
            expect(embed.fields[0].value).to.eq("C7");
            expect(embed.fields[1].inline).to.be.true;
            expect(embed.fields[1].name).to.eq("New Token");
            expect(embed.fields[1].value).to.eq("A1");

            expect(embed.type).to.eq("rich");
          })
          // Inspect S3 bucket
          .then(() => listObjects())
          .then(({ Contents }) => {
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

            expect(baseMap).to.eq(baseMapId);
            expect(currentMap).to.eq(newImageId);
            expect(history).to.have.length(2);
          })
          // Inspect Map document
          .then(() =>
            getDocument({
              table: Table.MAPS,
              key: {
                id: newImageId,
              },
            })
          )
          .then(({ Item }) => {
            const { tokens } = Item as CartoMap;

            expect(tokens).to.have.length(2);
            expect(tokens[0].colour).to.eq("Blue");
            expect(tokens[0].column).to.eq("C");
            expect(tokens[0].name).to.eq("Alvyn");
            expect(tokens[0].row).to.eq(7);
            expect(tokens[0].size).to.eq(1);

            expect(tokens[1].colour).to.be.a("string");
            expect(tokens[1].column).to.eq("A");
            expect(tokens[1].name).to.eq("New Token");
            expect(tokens[1].row).to.eq(1);
            expect(tokens[1].size).to.eq(1);
          });
      });

      describe("given an invalid size is provided", () => {
        it("should not add a new map and return an error", () => {
          cy.request({
            method: "POST",
            url: `http://localhost:8080/token/${channelId}`,
            body: {
              applicationId: application_id,
              token,
              column: "A",
              name: "New Token",
              row: 1,
              size: "BLAH",
            },
            failOnStatusCode: false,
          })
            .then((response) => {
              expect(response.body.url).to.eq(
                `https://discord.com/api/v9/webhooks/${application_id}/${token}/messages/@original`
              );
              const embed = response.body.json.embeds[0];

              expect(embed.title).to.eq("Token Error");
              expect(embed.description).to.eq(
                "Size BLAH is invalid.\nValid sizes are as in the [D&D Basic Rules](https://www.dndbeyond.com/sources/basic-rules/monsters#Size)"
              );

              expect(embed).not.to.have.property("fields");

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
              const { history } = Item as DiscordChannel;

              // Check length is still the same
              expect(history).to.have.length(1);
            });
        });
      });
    });
  });

  describe("Move Token", () => {
    describe("given the Client is called", () => {
      it("should return a deferred response", () => {
        const body = {
          type: 2,
          channel_id: channelId,
          token,
          application_id,
          data: {
            options: [
              {
                name: "move",
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
      it("should add a new map with the named token in a new position", () => {
        let newImageId: string;

        cy.request({
          method: "PUT",
          url: `http://localhost:8080/token/${channelId}`,
          body: {
            applicationId: application_id,
            token,
            column: "B",
            name: "Alvyn",
            row: 3,
          },
        })
          .then((response) => {
            expect(response.body.url).to.eq(
              `https://discord.com/api/v9/webhooks/${application_id}/${token}/messages/@original`
            );
            const embed = response.body.json.embeds[0];
            newImageId = embed.image.url.replace(/^.*[\\\/]/, "").split(".")[0];

            expect(embed.image.url).to.eq(
              `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
            );
            expect(embed.title).to.eq("Tokens updated");
            expect(embed.description).to.eq("Token positions:");

            expect(embed.fields).to.have.length(1);
            expect(embed.fields[0].inline).to.be.true;
            expect(embed.fields[0].name).to.eq("Alvyn");
            expect(embed.fields[0].value).to.eq("B3");

            expect(embed.type).to.eq("rich");
          })
          // Inspect S3 bucket
          .then(() => listObjects())
          .then(({ Contents }) => {
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

            expect(baseMap).to.eq(baseMapId);
            expect(currentMap).to.eq(newImageId);
            expect(history).to.have.length(2);
          })
          // Inspect Map document
          .then(() =>
            getDocument({
              table: Table.MAPS,
              key: {
                id: newImageId,
              },
            })
          )
          .then(({ Item }) => {
            const { tokens } = Item as CartoMap;

            expect(tokens).to.have.length(1);
            expect(tokens[0].colour).to.eq("Blue");
            expect(tokens[0].column).to.eq("B");
            expect(tokens[0].name).to.eq("Alvyn");
            expect(tokens[0].row).to.eq(3);
            expect(tokens[0].size).to.eq(1);
          });
      });
    });
  });
});
