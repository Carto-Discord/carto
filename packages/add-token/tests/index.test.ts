import {
  applyTokensToGrid,
  downloadImage,
  validateMapData,
  validateTokenPosition,
  uploadMap,
  Size,
} from "@carto/token-utils";

import { handler } from "../src/index";

jest.mock("@carto/token-utils");
jest.mock("nanoid", () => ({ nanoid: () => "4567" }));

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

describe("Handler", () => {
  const defaultProps = {
    application_id: "1234",
    channel_id: "1234567890",
    token: "mockToken",
    name: "token1",
    row: 4,
    column: "B",
    size: Size.HUGE,
    color: "red",
  };

  const mapBuffer = Buffer.from("hello world", "base64");

  const serverError = {
    statusCode: 500,
    body: JSON.stringify({
      application_id: defaultProps.application_id,
      token: defaultProps.token,
      embed: {
        title: "Token Add error",
        description:
          "Map data for this channel is incomplete.\nCreate the map again or [report it](https://www.github.com/carto-discord/carto/issues).",
        type: "rich",
      },
    }),
  };

  const expectedTokens = [
    { name: "existing1", row: 7, column: "E", color: "purple", size: 1 },
    { name: "token1", row: 4, column: "B", color: "red", size: 3 },
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

  it("should return a 200 response", async () => {
    const response = await handler(defaultProps);

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        application_id: defaultProps.application_id,
        token: defaultProps.token,
        embed: {
          title: "Token added",
          description: "Token positions:",
          image: {
            url: "https://s3.eu-central-1.amazonaws.com/maps/4567.png",
          },
          fields: [
            { name: "existing1", value: "E7", inline: true },
            { name: "token1", value: "B4", inline: true },
          ],
          type: "rich",
        },
      }),
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
            title: "Token Add error",
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

    it("should return a 200 response with only one token", async () => {
      const response = await handler(defaultProps);

      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          application_id: defaultProps.application_id,
          token: defaultProps.token,
          embed: {
            title: "Token added",
            description: "Token positions:",
            image: {
              url: "https://s3.eu-central-1.amazonaws.com/maps/4567.png",
            },
            fields: [{ name: "token1", value: "B4", inline: true }],
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
            title: "Token Add error",
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
            title: "Token Add error",
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

    describe("given no color or size is provided", () => {
      it("should call applyTokensToGrid with default value", async () => {
        await handler({
          ...defaultProps,
          color: undefined,
          size: undefined,
        });

        expect(mockApplyTokensToGrid).toBeCalledWith({
          baseFilename: "download.png",
          margin: { x: 55, y: 65 },
          tokens: [
            {
              name: "existing1",
              row: 7,
              column: "E",
              color: "purple",
              size: 1,
            },
            {
              name: "token1",
              row: 4,
              column: "B",
              color: expect.stringMatching(/^#(?:[0-9a-fA-F]{3}){1,2}$/),
              size: 1,
            },
          ],
        });
      });
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
            title: "Token Add error",
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
            title: "Token Add error",
            description:
              "An error occured while creating the new map. Please try again later",
            type: "rich",
          },
        }),
      });
    });
  });
});
