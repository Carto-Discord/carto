import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import { existingChannel, newExistingChannel } from "../fixtures/channels.json";
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

describe("Add Token", () => {
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

  it("should add a new map with new tokens and specified optional properties", () => {
    let newImageId: string;

    const headers = generateHeaders(addBody);

    cy.request({
      method: "POST",
      url,
      body: addBody,
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

        expect(tokens).to.have.length(2);
        expect(tokens[0].color).to.eq("Blue");
        expect(tokens[0].column).to.eq("C");
        expect(tokens[0].name).to.eq("Alvyn");
        expect(tokens[0].row).to.eq(7);
        expect(tokens[0].size).to.eq(1);

        expect(tokens[1].color).to.be.a("string");
        expect(tokens[1].column).to.eq("E");
        expect(tokens[1].name).to.eq("Sam");
        expect(tokens[1].row).to.eq(4);
        expect(tokens[1].size).to.eq(1);
      });
  });

  it("should add a new map with new tokens and no optional properties", () => {
    let newImageId: string;

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

    cy.request({
      method: "POST",
      url,
      body: optionalBody,
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

        expect(tokens).to.have.length(2);
        expect(tokens[0].color).to.eq("Blue");
        expect(tokens[0].column).to.eq("C");
        expect(tokens[0].name).to.eq("Alvyn");
        expect(tokens[0].row).to.eq(7);
        expect(tokens[0].size).to.eq(1);

        expect(tokens[1].color).to.be.a("string");
        expect(tokens[1].column).to.eq("E");
        expect(tokens[1].name).to.eq("Sam");
        expect(tokens[1].row).to.eq(4);
        expect(tokens[1].size).to.eq(1);
      });
  });

  it("should add a new map with new tokens and no existing tokens", () => {
    let newImageId: string;

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

    cy.request({
      method: "POST",
      url,
      body: noTokensBody,
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
          `https://s3.us-east-1.amazonaws.com/carto-bot-maps/${newImageId}.png`
        );
        expect(embed.title).to.eq("Token added");
        expect(embed.description).to.eq("Token positions:");

        expect(embed.fields).to.have.length(1);
        expect(embed.fields[0].inline).to.be.true;
        expect(embed.fields[0].name).to.eq("Sam");
        expect(embed.fields[0].value).to.eq("E4");

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
            id: newExistingChannel,
          },
        })
      )
      .then(({ Item }) => {
        const { baseMap, currentMap, history } = Item as DiscordChannel;

        expect(baseMap).to.eq(baseMapId);
        expect(currentMap).to.eq(newImageId);
        expect(history).to.have.length(1);
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

        expect(tokens[0].color).to.be.a("string");
        expect(tokens[0].column).to.eq("E");
        expect(tokens[0].name).to.eq("Sam");
        expect(tokens[0].row).to.eq(4);
        expect(tokens[0].size).to.eq(1);
      });
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
              id: existingChannel,
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

  describe("given a token with the same name as an existing one is added", () => {
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

          expect(embed.title).to.eq("Token Add error");
          expect(embed.description).to.eq(
            "A token called Alvyn already exists on the map. \nMove it with `/token move` or remove it with `/token delete`"
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

          // Check length is still the same
          expect(history).to.have.length(1);
        });
    });
  });
});
