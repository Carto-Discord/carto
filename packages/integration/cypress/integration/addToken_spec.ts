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

describe("Add Token", () => {
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

  const addBody = {
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

  it("should add a new map with new tokens and default optional properties", () => {
    let newImageId: string;

    const timestamp = Date.now();

    const headers = {
      "x-signature-ed25519": generateSignature(
        JSON.stringify(addBody),
        timestamp.toString()
      ),
      "x-signature-timestamp": timestamp,
    };

    cy.visit("/");

    cy.request({
      method: "POST",
      url,
      body: addBody,
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
        expect(embed.title).to.eq("Token added");
        expect(embed.description).to.eq("Token positions:");

        expect(embed.fields).to.have.length(2);
        expect(embed.fields[0].inline).to.be.true;
        expect(embed.fields[0].name).to.eq("Alvyn");
        expect(embed.fields[0].value).to.eq("C7");
        expect(embed.fields[1].inline).to.be.true;
        expect(embed.fields[1].name).to.eq("Sam");
        expect(embed.fields[1].value).to.eq("E4");

        expect(embed.type).to.eq("rich");
      })
      // Inspect S3 bucket
      .then(() => getObject(`${newImageId}.png`))
      .then((obj) => {
        expect(obj).to.have.property("Body");
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

    describe("given an invalid location is provided", () => {
      it("should not add a new map and return an error", () => {
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
                  {
                    name: "size",
                    value: "MEDIUM",
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

            expect(embed.title).to.eq("Token Add error");
            expect(embed.description).to.eq(
              "The row or column you entered is out of bounds.\nThis map's bounds are 40 rows by 40 columns"
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