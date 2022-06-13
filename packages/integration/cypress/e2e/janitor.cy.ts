import { nanoid } from "nanoid";

import { baseMapId, currentMapId, previousMapId } from "../fixtures/maps.json";
import { existingChannel, newExistingChannel } from "../fixtures/channels.json";
import mockImage from "../fixtures/mockImage";

import {
  deleteObjects,
  getDocument,
  getJanitorInvokeUrl,
  initialiseDynamoDB,
  listObjects,
  putObject,
  Table,
  teardownDynamoDB,
} from "../support/e2e";

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

  const idsToKeep = [
    `${existingChannel}/${baseMapId}.png`,
    `${existingChannel}/${currentMapId}.png`,
    `${existingChannel}/${previousMapId}.png`,
    `${newExistingChannel}/${baseMapId}.png`,
    `${newExistingChannel}/${currentMapId}.png`,
    `${newExistingChannel}/${previousMapId}.png`,
  ];

  beforeEach(async () => {
    const { Contents } = await listObjects();

    await deleteObjects(
      Contents.map(({ Key }) =>
        !idsToKeep.includes(Key) ? Key : undefined
      ).filter(Boolean)
    );

    await teardownDynamoDB();

    await Promise.all(
      ids.map((id) => putObject(mockImage, `${channelToKeep.id}/${id}.png`))
    );
  });

  describe("given a channel can be deleted", () => {
    beforeEach(async () => {
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
          Promise.all(
            [
              channelToDelete.baseMap,
              channelToDelete.currentMap,
              channelToDelete.history[0],
            ].map((id) => getDocument({ table: Table.MAPS, key: { id } }))
          )
        )
        .then((documents) => {
          expect(documents[0].Item).to.be.undefined;
          expect(documents[1].Item).to.be.undefined;
          expect(documents[2].Item).to.be.undefined;
        })
        // Inspect S3 bucket
        .then(() => listObjects())
        .then(({ Contents }) => {
          expect(Contents.map(({ Key }) => Key)).not.to.have.members([
            `${channelToDelete.id}/${channelToDelete.baseMap}.png`,
            `${channelToDelete.id}/${channelToDelete.currentMap}.png`,
            `${channelToDelete.id}/${channelToDelete.history[0]}.png`,
          ]);
        });
    });
  });

  describe("given no channel should be deleted", () => {
    beforeEach(async () => {
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
          Promise.all(
            [
              channelToKeep.baseMap,
              channelToKeep.currentMap,
              channelToKeep.history[0],
            ].map((id) => getDocument({ table: Table.MAPS, key: { id } }))
          )
        )
        .then((documents) => {
          expect(documents[0].Item).to.deep.eq(mapContentsToKeep[0]);
          expect(documents[1].Item).to.deep.eq(mapContentsToKeep[1]);
          expect(documents[2].Item).to.deep.eq(mapContentsToKeep[2]);
        })
        // Inspect S3 bucket
        .then(() => listObjects())
        .then(({ Contents }) => {
          expect(Contents.map(({ Key }) => Key)).to.include.members([
            `${channelToKeep.id}/${channelToKeep.baseMap}.png`,
            `${channelToKeep.id}/${channelToKeep.currentMap}.png`,
            `${channelToKeep.id}/${channelToKeep.history[0]}.png`,
          ]);
        });
    });
  });

  describe("given some maps are orphaned", () => {
    beforeEach(async () => {
      await initialiseDynamoDB({
        table: Table.CHANNELS,
        contents: [channelToKeep],
      });

      await initialiseDynamoDB({
        table: Table.MAPS,
        contents: [...mapContentsToDelete, ...mapContentsToKeep],
      });
    });

    it("should delete those orphaned maps", () => {
      // Wait for S3 uploads to be registered
      cy.wait(2000);

      cy.request({
        method: "GET",
        url,
      })
        .its("status")
        .should("eq", 200)
        // Inspect Map documents
        .then(() =>
          Promise.all(
            [
              channelToDelete.baseMap,
              channelToDelete.currentMap,
              channelToDelete.history[0],
            ].map((id) => getDocument({ table: Table.MAPS, key: { id } }))
          )
        )
        .then((documents) => {
          expect(documents[0].Item).to.be.undefined;
          expect(documents[1].Item).to.be.undefined;
          expect(documents[2].Item).to.be.undefined;
        })
        // Inspect S3 bucket
        .then(() => listObjects())
        .then(({ Contents }) => {
          expect(Contents.map(({ Key }) => Key)).not.to.have.members([
            `${channelToDelete.id}/${channelToDelete.baseMap}.png`,
            `${channelToDelete.id}/${channelToDelete.currentMap}.png`,
            `${channelToDelete.id}/${channelToDelete.history[0]}.png`,
          ]);
        });
    });
  });
});
