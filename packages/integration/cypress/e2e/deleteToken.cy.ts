import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import { existingChannel } from "../fixtures/channels.json";
import {
  getLambdaInvokeUrl,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
  getDocument,
  getObject,
  Command,
  generateHeaders,
} from "../support/e2e";
import { CartoMap, DiscordChannel } from "../support/aws/types";

describe("Delete Token", () => {
  let url: string;

  const token = "mockToken";
  const application_id = "mockApplicationId";

  const channelContents = [
    {
      id: existingChannel,
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
        {
          color: "Red",
          column: "A",
          name: "Bob",
          row: 3,
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

  const deleteBody: Command = {
    type: 2,
    channel_id: existingChannel,
    token,
    application_id,
    data: {
      options: [
        {
          name: "delete",
          options: [
            {
              name: "name",
              value: "Alvyn",
            },
          ],
        },
      ],
      name: "token",
      id: "token-id",
    },
  };

  beforeEach(async () => {
    url = await getLambdaInvokeUrl();
    cy.log(`Client URL: ${url}`);

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

  it("should add a new map with the named token removed", () => {
    let newImageId: string;

    const headers = generateHeaders(deleteBody);

    cy.request({
      method: "POST",
      url,
      body: deleteBody,
      headers,
    })
      .its("status")
      .should("eq", 200);

    cy.get("ul li", { timeout: 30000 })
      .then((item) => {
        const { params, body } = JSON.parse(item.text());
        expect(params).to.deep.equal({
          applicationId: application_id,
          token,
        });
        const embed = body.embeds[0];
        newImageId = embed.image.url.replace(/^.*[\\/]/, "").split(".")[0];

        expect(embed.image.url).to.eq(
          `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${existingChannel}/${newImageId}.png`
        );
        expect(embed.title).to.eq("Token deleted");
        expect(embed.description).to.eq("Token positions:");
        expect(embed.fields).to.have.length(1);
        expect(embed.fields[0].inline).to.be.true;
        expect(embed.fields[0].name).to.eq("Bob");
        expect(embed.fields[0].value).to.eq("A3");
        expect(embed.type).to.eq("rich");
      })
      // Inspect Channel document
      .then(() =>
        getDocument({
          table: Table.CHANNELS,
          key: {
            id: existingChannel,
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
      })
      // Inspect S3 bucket
      .then(() => getObject(`${existingChannel}/${newImageId}.png`))
      .then((obj) => {
        expect(obj).to.have.property("Body");
      });
  });

  describe("given the all parameter is sent", () => {
    it("should add a new map with all the tokens removed", () => {
      const deleteAllBody = {
        ...deleteBody,
        data: {
          options: [
            {
              name: "delete",
              options: [
                {
                  name: "all",
                  value: true,
                },
              ],
            },
          ],
          name: "token",
          id: "token-id",
        },
      };

      const headers = generateHeaders(deleteAllBody);

      cy.request({
        method: "POST",
        url,
        body: deleteAllBody,
        headers,
      })
        .its("status")
        .should("eq", 200);

      cy.get("ul li", { timeout: 30000 })
        .then((item) => {
          const { params, body } = JSON.parse(item.text());
          expect(params).to.deep.equal({
            applicationId: application_id,
            token,
          });
          const embed = body.embeds[0];

          expect(embed.image.url).to.eq(
            `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${existingChannel}/${baseMapId}.png`
          );
          expect(embed.title).to.eq("Token deleted");
          expect(embed.description).to.eq("All Tokens removed");
          expect(embed.type).to.eq("rich");
        })
        // Inspect Channel document
        .then(() =>
          getDocument({
            table: Table.CHANNELS,
            key: {
              id: existingChannel,
            },
          })
        )
        .then(({ Item }) => {
          const { baseMap, currentMap, history } = Item as DiscordChannel;

          expect(baseMap).to.eq(baseMapId);
          expect(currentMap).to.eq(baseMapId);
          expect(history).to.have.length(2);
        })
        // Inspect Map document
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: {
              id: baseMapId,
            },
          })
        )
        .then(({ Item }) => {
          expect(Item).not.to.have.property("tokens");
        })
        // Inspect S3 bucket
        .then(() => getObject(`${existingChannel}/${baseMapId}.png`))
        .then((obj) => {
          expect(obj).to.have.property("Body");
        });
    });
  });

  describe("given the named token is not found", () => {
    it("should not add a new map", () => {
      const body = {
        ...deleteBody,
        data: {
          options: [
            {
              name: "delete",
              options: [
                {
                  name: "name",
                  value: "BadToken",
                },
              ],
            },
          ],
          name: "token",
          id: "token-id",
        },
      };

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
            applicationId: application_id,
            token,
          });
          const embed = body.embeds[0];

          expect(embed.title).to.eq("Token Delete error");
          expect(embed.description).to.eq(
            "Token BadToken not found in map. Token names are case sensitive, so try again or add it using `/token add`"
          );
          expect(embed).not.to.have.property("fields");
          expect(embed.type).to.eq("rich");
        })
        // Inspect Channel document
        .then(() =>
          getDocument({
            table: Table.CHANNELS,
            key: {
              id: existingChannel,
            },
          })
        )
        .then(({ Item }) => {
          const { history } = Item as DiscordChannel;
          expect(history).to.have.length(1);
        });
    });
  });
});
