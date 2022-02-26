import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import { existingChannel } from "../fixtures/channels.json";
import {
  getLambdaInvokeUrl,
  initialiseDynamoDB,
  teardownDynamoDB,
  getDocument,
  Table,
  Command,
  generateHeaders,
} from "../support";

describe("Delete Map", () => {
  let url: string;

  const token = "mockToken";
  const applicationId = "mockApplicationId";

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

  const body: Command = {
    type: 2,
    channel_id: existingChannel,
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
    it("should delete the existing map config", () => {
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
              id: existingChannel,
            },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.be.undefined;
        });
    });
  });
});
