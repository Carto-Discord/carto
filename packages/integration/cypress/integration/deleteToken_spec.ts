import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
  getDocument,
  getObject,
  Command,
  generateHeaders,
} from "../support";
import { CartoMap, DiscordChannel } from "../support/aws/types";

describe("Delete Token", () => {
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

  const deleteBody: Command = {
    type: 2,
    channel_id: channelId,
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
      .its("body")
      .its("type")
      .should("eq", 5);

    cy.get("ul li", { timeout: 30000 })
      .then((item) => {
        const { params, body } = JSON.parse(item.text());
        expect(params).to.deep.equal({
          applicationId: application_id,
          token,
        });
        const embed = body.embeds[0];
        newImageId = embed.image.url.replace(/^.*[\\\/]/, "").split(".")[0];

        expect(embed.image.url).to.eq(
          `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
        );
        expect(embed.title).to.eq("Token deleted");
        expect(embed.description).to.eq("All Tokens removed");
        expect(embed.fields).to.have.length(0);
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

        expect(tokens).to.have.length(0);
      })
      // Inspect S3 bucket
      .then(() => getObject(`${newImageId}.png`))
      .then((obj) => {
        expect(obj).to.have.property("Body");
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
        .its("body")
        .its("type")
        .should("eq", 5);

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
              id: channelId,
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
