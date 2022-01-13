import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
  getDocument,
  getObject,
} from "../support";
import { CartoMap, DiscordChannel } from "../support/aws/types";

describe.skip("Move Token", () => {
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

  const moveBody = {
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

  it("should add a new map with the named token in a new position", () => {
    let newImageId: string;

    const timestamp = Date.now();

    const headers = {
      "x-signature-ed25519": generateSignature(
        JSON.stringify(moveBody),
        timestamp.toString()
      ),
      "x-signature-timestamp": timestamp,
    };

    cy.visit("/");

    cy.request({
      method: "POST",
      url,
      body: moveBody,
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
        expect(embed.title).to.eq("Token moved");
        expect(embed.description).to.eq("Token positions:");

        expect(embed.fields).to.have.length(1);
        expect(embed.fields[0].inline).to.be.true;
        expect(embed.fields[0].name).to.eq("Alvyn");
        expect(embed.fields[0].value).to.eq("B3");

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

        expect(tokens).to.have.length(1);
        expect(tokens[0].color).to.eq("Blue");
        expect(tokens[0].column).to.eq("B");
        expect(tokens[0].name).to.eq("Alvyn");
        expect(tokens[0].row).to.eq(3);
        expect(tokens[0].size).to.eq(1);
      })
      // Inspect S3 bucket
      .then(() => getObject(`${newImageId}.png`))
      .then((obj) => {
        expect(obj).to.have.property("Body");
      });

    describe("given the named token is not found", () => {
      it("should not add a new map", () => {
        const body = {
          ...moveBody,
          data: {
            options: [
              {
                name: "move",
                options: [
                  {
                    name: "name",
                    value: "BadToken",
                  },
                  {
                    name: "row",
                    value: 3,
                  },
                  {
                    name: "column",
                    value: "B",
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

        cy.visit("/");

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

            expect(embed.title).to.eq("Token Move error");
            expect(embed.description).to.eq(
              "Token BadToken not found in map. Token names are case sensitive, so try again or add it using /token add"
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
});
