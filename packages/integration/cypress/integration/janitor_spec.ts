import { nanoid } from "nanoid";

import mockImage from "../fixtures/mockImage";

import {
  deleteObject,
  deleteObjects,
  getDocument,
  getJanitorInvokeUrl,
  initialiseDynamoDB,
  listObjects,
  putObject,
  Table,
  teardownDynamoDB,
} from "../support";

describe("Janitor", () => {
  let url: string;

  const ids = Array(6)
    .fill("")
    .map(() => nanoid());

  const channelToDelete = {
    id: "123",
    baseMap: ids[0],
    currentMap: ids[1],
    history: [ids[2]],
  };

  const channelToKeep = {
    id: "828332035436969984",
    baseMap: ids[3],
    currentMap: ids[4],
    history: [ids[5]],
  };

  const mapContentsToKeep = [
    {
      id: channelToKeep.baseMap,
      columns: 40,
      margin: { x: 55, y: 55 },
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: channelToKeep.currentMap,
      tokens: [],
    },
    {
      id: channelToKeep.history[0],
      tokens: [],
    },
  ];

  const mapContentsToDelete = [
    {
      id: channelToDelete.baseMap,
      columns: 40,
      margin: { x: 55, y: 55 },
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: channelToDelete.currentMap,
      columns: 40,
      margin: { x: 55, y: 55 },
      rows: 40,
      url: "https://i.redd.it/hfoxphcnnix61.jpg",
    },
    {
      id: channelToDelete.history[0],
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
    const { Contents } = await listObjects();

    await deleteObjects(Contents.map(({ Key }) => Key));

    await teardownDynamoDB();
  });

  describe("given a channel can be deleted", () => {
    beforeEach(async () => {
      await Promise.all(ids.map((id) => putObject(mockImage, `${id}.png`)));

      await initialiseDynamoDB({
        table: Table.CHANNELS,
        contents: [channelToDelete, channelToKeep],
      });

      await initialiseDynamoDB({
        table: Table.MAPS,
        contents: [...mapContentsToDelete, ...mapContentsToKeep],
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
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: { id: channelToDelete.baseMap },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.be.undefined;
        })
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: { id: channelToDelete.currentMap },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.be.undefined;
        })
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: { id: channelToDelete.history[0] },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.be.undefined;
        })
        // Inspect S3 bucket
        .then(() => listObjects())
        .then(({ Contents }) => {
          expect(Contents.map(({ Key }) => Key)).not.to.have.members([
            `${channelToDelete.baseMap}.png`,
            `${channelToDelete.currentMap}.png`,
            `${channelToDelete.history[0]}.png`,
          ]);
        });
    });
  });

  describe("given no channel should be deleted", () => {
    beforeEach(async () => {
      await Promise.all(
        mapContentsToKeep.map(({ id }) => putObject(mockImage, `${id}.png`))
      );

      await initialiseDynamoDB({
        table: Table.CHANNELS,
        contents: [channelToKeep],
      });

      await initialiseDynamoDB({
        table: Table.MAPS,
        contents: mapContentsToKeep,
      });
    });

    it("should not delete either the channel or its maps", () => {
      // Wait for S3 uploads to be registered
      cy.wait(2000);

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
              id: channelToKeep.id,
            },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.deep.eq(channelToKeep);
        })
        // Inspect Map documents
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: { id: channelToKeep.baseMap },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.deep.eq(mapContentsToKeep[0]);
        })
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: { id: channelToKeep.currentMap },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.deep.eq(mapContentsToKeep[1]);
        })
        .then(() =>
          getDocument({
            table: Table.MAPS,
            key: { id: channelToKeep.history[0] },
          })
        )
        .then(({ Item }) => {
          expect(Item).to.deep.eq(mapContentsToKeep[2]);
        })
        // Inspect S3 bucket
        .then(() => listObjects())
        .then(({ Contents }) => {
          expect(Contents.map(({ Key }) => Key)).to.include.members([
            `${channelToKeep.baseMap}.png`,
            `${channelToKeep.currentMap}.png`,
            `${channelToKeep.history[0]}.png`,
          ]);
        });
    });
  });
});
