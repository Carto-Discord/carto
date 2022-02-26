import {
  applyTokensToGrid,
  downloadImage,
  validateMapData,
  validateTokenPosition,
  uploadMap,
} from "@carto/token-utils";

import { deleteAllTokens } from "../src/deleteAll";
import { handler, Event } from "../src/index";

jest.mock("@carto/token-utils");
jest.mock("nanoid", () => ({ nanoid: () => "4567" }));
jest.mock("../src/deleteAll");

const mockValidateMapData = validateMapData as jest.MockedFunction<
  typeof validateMapData
>;
const mockValidateTokenPosition = validateTokenPosition as jest.MockedFunction<
  typeof validateTokenPosition
>;
const mockDownloadImage = downloadImage as jest.MockedFunction<
  typeof downloadImage
>;
const mockApplyTokensToGrid = applyTokensToGrid as jest.MockedFunction<
  typeof applyTokensToGrid
>;
const mockUploadMap = uploadMap as jest.MockedFunction<typeof uploadMap>;
const mockDeleteAllTokens = deleteAllTokens as jest.MockedFunction<
  typeof deleteAllTokens
>;

describe("Handler", () => {
  const defaultProps: Event = {
    application_id: "1234",
    channel_id: "1234567890",
    token: "mockToken",
    subCommand: "move",
    name: "existing1",
    row: 4,
    column: "B",
  };

  const mapBuffer = Buffer.from("hello world", "base64");

  const serverError = {
    statusCode: 500,
    body: JSON.stringify({
      application_id: defaultProps.application_id,
      token: defaultProps.token,
      embed: {
        title: "Token Move error",
        description:
          "Map data for this channel is incomplete.\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.",
        type: "rich",
      },
    }),
  };

  const expectedTokens = [
    { name: "existing1", row: 4, column: "B", color: "purple", size: 1 },
  ];

  beforeAll(() => {
    process.env.AWS_REGION = "eu-central-1";
    process.env.MAPS_BUCKET = "maps";
  });

  beforeEach(() => {
    mockValidateMapData.mockResolvedValue({
      statusCode: 200,
      baseMapData: {
        Item: {
          id: { S: "1234567890" },
          margin: { M: { x: { N: "55" }, y: { N: "65" } } },
          rows: { N: "6" },
          columns: { N: "9" },
        },
        $metadata: {},
      },
      baseMapFilename: "object.png",
      currentMapData: {
        Item: {
          tokens: {
            L: [
              {
                M: {
                  name: { S: "existing1" },
                  row: { N: "7" },
                  column: { S: "E" },
                  color: { S: "purple" },
                  size: { N: "1" },
                },
              },
            ],
          },
        },
        $metadata: {},
      },
    });
    mockValidateTokenPosition.mockReturnValue(true);
    mockDownloadImage.mockResolvedValue();
    mockApplyTokensToGrid.mockResolvedValue(mapBuffer);
    mockUploadMap.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("given move action is requested", () => {
    it("should return a 200 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token moved",
            description: "Token positions:",
            image: {
              url: "https://s3.eu-central-1.amazonaws.com/maps/1234567890/4567.png",
            },
            fields: [{ name: "existing1", value: "B4", inline: true }],
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given delete subCommand is requested", () => {
    describe("given a name is provided", () => {
      it("should return a 200 response", async () => {
        const response = await handler({
          ...defaultProps,
          subCommand: "delete",
        });

        expect(response).toEqual({
          statusCode: 200,
          body: JSON.stringify({
            application_id: defaultProps.application_id,
            token: defaultProps.token,
            embed: {
              title: "Token deleted",
              description: "All Tokens removed",
              image: {
                url: "https://s3.eu-central-1.amazonaws.com/maps/1234567890/4567.png",
              },
              fields: [],
              type: "rich",
            },
          }),
        });
      });
    });

    describe("given all tokens should be deleted", () => {
      describe("given the baseMap has no id", () => {
        beforeEach(() => {
          mockValidateMapData.mockResolvedValue({
            statusCode: 200,
            baseMapData: {
              Item: {
                margin: { M: { x: { N: "55" }, y: { N: "65" } } },
                rows: { N: "6" },
                columns: { N: "9" },
              },
              $metadata: {},
            },
            baseMapFilename: "object.png",
            currentMapData: {
              Item: {
                tokens: {
                  L: [
                    {
                      M: {
                        name: { S: "existing1" },
                        row: { N: "7" },
                        column: { S: "E" },
                        color: { S: "purple" },
                        size: { N: "1" },
                      },
                    },
                  ],
                },
              },
              $metadata: {},
            },
          });
        });

        it("should return a 404 response", async () => {
          const response = await handler({
            ...defaultProps,
            all: true,
            name: undefined,
            subCommand: "delete",
          });

          expect(mockDeleteAllTokens).not.toBeCalled();

          expect(response).toEqual({
            statusCode: 404,
            body: JSON.stringify({
              application_id: defaultProps.application_id,
              token: defaultProps.token,
              embed: {
                title: "Token Delete error",
                description:
                  "Map data for this channel is incomplete.\nFor help, refer to the [troubleshooting](https://carto-discord.github.io/carto/troubleshooting) page.",
                type: "rich",
              },
            }),
          });
        });
      });

      it("should return a 200 response", async () => {
        const response = await handler({
          ...defaultProps,
          all: true,
          name: undefined,
          subCommand: "delete",
        });

        expect(mockDeleteAllTokens).toBeCalledWith({
          baseMapId: "1234567890",
          channelId: defaultProps.channel_id,
        });

        expect(response).toEqual({
          statusCode: 200,
          body: JSON.stringify({
            application_id: defaultProps.application_id,
            token: defaultProps.token,
            embed: {
              title: "Token deleted",
              description: "All Tokens removed",
              image: {
                url: "https://s3.eu-central-1.amazonaws.com/maps/1234567890/1234567890.png",
              },
              type: "rich",
            },
          }),
        });
      });
    });
  });

  describe("given map data cannot be found", () => {
    beforeEach(() => {
      mockValidateMapData.mockResolvedValue({ statusCode: 404 });
    });

    it("should return a 404 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description:
              "No map exists for this channel.\nCreate one with the `/map create` command",
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given map data cannot be validated", () => {
    beforeEach(() => {
      mockValidateMapData.mockResolvedValue({ statusCode: 500 });
    });

    it("should return a 500 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual(serverError);
    });
  });

  describe("given the baseMapData is empty", () => {
    beforeEach(() => {
      mockValidateMapData.mockResolvedValue({
        statusCode: 200,
        baseMapData: { $metadata: {} },
        baseMapFilename: "object.png",
        currentMapData: {
          Item: {},
          $metadata: {},
        },
      });
    });

    it("should return a 500 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual(serverError);
    });
  });

  describe("given the currentMapData is empty", () => {
    beforeEach(() => {
      mockValidateMapData.mockResolvedValue({
        statusCode: 200,
        baseMapData: { Item: {}, $metadata: {} },
        baseMapFilename: "object.png",
        currentMapData: {
          $metadata: {},
        },
      });
    });

    it("should return a 500 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual(serverError);
    });
  });

  describe.each([
    [
      "margin",
      {
        rows: { N: "6" },
        columns: { N: "9" },
      },
    ],
    [
      "rows",
      {
        margin: { M: {} },
        columns: { N: "9" },
      },
    ],
    [
      "columns",
      {
        margin: { M: {} },
        rows: { N: "6" },
      },
    ],
  ])("given %s is empty", (_, Item) => {
    beforeEach(() => {
      mockValidateMapData.mockResolvedValue({
        statusCode: 200,
        baseMapData: { Item, $metadata: {} },
        baseMapFilename: "object.png",
        currentMapData: {
          Item: {},
          $metadata: {},
        },
      });
    });

    it("should return a 500 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual(serverError);
    });
  });

  describe("given tokens is empty", () => {
    beforeEach(() => {
      mockValidateMapData.mockResolvedValue({
        statusCode: 200,
        baseMapData: {
          Item: {
            margin: { M: {} },
            rows: { N: "6" },
            columns: { N: "9" },
          },
          $metadata: {},
        },
        baseMapFilename: "object.png",
        currentMapData: {
          Item: {},
          $metadata: {},
        },
      });
    });

    it("should return a 404 response", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description:
              "No tokens were found on this map. You can add one with `/token add`",
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given the token name is invalid", () => {
    it("should return a 400 response", async () => {
      const response = await handler({ ...defaultProps, name: "nonexisting1" });

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description:
              "Token nonexisting1 not found in map. Token names are case sensitive, so try again or add it using `/token add`",
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given the token position is invalid", () => {
    beforeEach(() => {
      mockValidateTokenPosition.mockReturnValue(false);
    });

    it("should return a 400 response", async () => {
      const response = await handler(defaultProps);

      expect(mockValidateTokenPosition).toBeCalledWith({
        token: { row: 4, column: "B" },
        grid: { rows: 6, columns: 9 },
      });

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description: `The row or column you entered is out of bounds.\nThis map's bounds are 6 rows by 9 columns`,
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given the image download fails", () => {
    beforeEach(() => {
      mockDownloadImage.mockRejectedValue(new Error("Something went wrong"));
    });

    it("should return a 404 response", async () => {
      const response = await handler(defaultProps);

      expect(mockDownloadImage).toBeCalledWith("object.png", "download.png");

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description:
              "Map could not be recreated. Reason: Original map could not be found",
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given applying tokens fails", () => {
    beforeEach(() => {
      mockApplyTokensToGrid.mockResolvedValue(undefined);
    });

    it("should return a 500 response", async () => {
      const response = await handler(defaultProps);

      expect(mockApplyTokensToGrid).toBeCalledWith({
        baseFilename: "download.png",
        margin: { x: 55, y: 65 },
        tokens: expectedTokens,
      });

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description: "Map could not be created",
            type: "rich",
          },
        }),
      });
    });
  });

  describe("given the map upload fails", () => {
    beforeEach(() => {
      mockUploadMap.mockResolvedValue(false);
    });

    it("should return a 500 response", async () => {
      const response = await handler(defaultProps);

      expect(mockUploadMap).toBeCalledWith({
        buffer: mapBuffer,
        channelId: defaultProps.channel_id,
        mapId: "4567",
        tokens: expectedTokens,
      });

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token Move error",
            description:
              "An error occured while creating the new map. Please try again later",
            type: "rich",
          },
        }),
      });
    });
  });
});
