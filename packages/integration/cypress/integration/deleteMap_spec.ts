import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  teardownDynamoDB,
  getDocument,
  Table,
} from "../support";

describe("Delete Map", () => {
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

  const body = {
    type: 2,
    channel_id: channelId,
    token,
    application_id: applicationId,
    data: {
      options: [
        {
          name: "delete",
          options: [],
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

  describe("given the channel has an associated map", () => {
    it("should delete the existing map config", () => {
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
            applicationId,
            token,
          });
          const embed = body.embeds[0];

          expect(embed.title).to.eq("Channel data deleted");

          expect(embed.description).to.eq(
            "All related maps will be erased from Carto within 24 hours"
          );

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
          expect(Item).to.be.undefined;
        });
    });
  });
});
