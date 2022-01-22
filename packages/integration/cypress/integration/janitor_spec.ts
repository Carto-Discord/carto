import {
  baseMapId,
  currentMapId,
  previousMapId,
  deleteMap1,
  deleteMap2,
  deleteMap3,
} from "../fixtures/maps.json";

import {
  getDocument,
  getJanitorInvokeUrl,
  initialiseDynamoDB,
  listObjects,
  Table,
  teardownDynamoDB,
} from "../support";

describe("Janitor", () => {
  let url: string;

  const channelToDelete = {
    id: "123",
    baseMap: deleteMap1,
    currentMap: deleteMap2,
    history: [deleteMap3],
  };

  const channelToKeep = {
    id: "828332035436969984",
    baseMap: baseMapId,
    currentMap: currentMapId,
    history: [previousMapId],
  };

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
      tokens: [],
    },
    {
      id: previousMapId,
      tokens: [],
    },
    {
      id: deleteMap1,
      columns: 40,
      margin: { x: 55, y: 55 },
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: deleteMap2,
      columns: 40,
      margin: { x: 55, y: 55 },
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: deleteMap3,
      columns: 40,
      margin: { x: 55, y: 55 },
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
  ];

  before(async () => {
    url = await getJanitorInvokeUrl();
    cy.log(`Janitor URL: ${url}`);
  });

  beforeEach(async () => {
    await teardownDynamoDB();

    await initialiseDynamoDB({
      table: Table.CHANNELS,
      contents: [channelToDelete, channelToKeep],
    });

    await initialiseDynamoDB({
      table: Table.MAPS,
      contents: mapContents,
    });
  });

  it("should delete one channel and its maps", () => {
    cy.request({
      method: "GET",
      url,
    })
      .its("status")
      .should("eq", 200)
      // Inspect Channel document
      .then(() =>
        getDocument({
          table: Table.CHANNELS,
          key: {
            id: channelToDelete.id,
          },
        })
      )
      .then(({ Item }) => {
        expect(Item).to.be.undefined;
      })
      // Inspect Map documents
      .then(() => getDocument({ table: Table.MAPS, key: { id: deleteMap1 } }))
      .then(({ Item }) => {
        expect(Item).to.be.undefined;
      })
      .then(() => getDocument({ table: Table.MAPS, key: { id: deleteMap2 } }))
      .then(({ Item }) => {
        expect(Item).to.be.undefined;
      })
      .then(() => getDocument({ table: Table.MAPS, key: { id: deleteMap3 } }))
      .then(({ Item }) => {
        expect(Item).to.be.undefined;
      })
      // Inspect S3 bucket
      .then(() => listObjects())
      .then(({ Contents }) => {
        expect(Contents.map(({ Key }) => Key)).not.to.include(
          `${deleteMap1}.png`
        );
      });
  });
});
