import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import {
  getLambdaInvokeUrl,
  generateSignature,
  initialiseDynamoDB,
  teardownDynamoDB,
  Table,
} from "../support";

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
  });
});
