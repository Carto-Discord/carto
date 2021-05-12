import { Response } from "express";
import { InteractionResponseType } from "slash-commands";
import { getCurrentMap } from "./firestore";
import { getMap } from "./get";

jest.mock("./firestore");

const mockGetCurrentMap = getCurrentMap as jest.MockedFunction<
  typeof getCurrentMap
>;

describe("Get", () => {
  const mockJson = jest.fn().mockReturnValue({ end: jest.fn() });
  //@ts-ignore
  const mockResponse: Response = {
    status: jest.fn().mockReturnValue({
      json: mockJson,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Get Map", () => {
    describe("given getCurrentMap returns undefined", () => {
      beforeEach(() => {
        mockGetCurrentMap.mockResolvedValue(undefined);
      });

      it("should call res with a negative response", async () => {
        await getMap({ channelId: "123", res: mockResponse });

        expect(mockJson).toBeCalledWith({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "No map no found for this channel",
          },
        });
      });
    });

    describe("given getCurrentMap returns a map", () => {
      beforeEach(() => {
        mockGetCurrentMap.mockResolvedValue({
          publicUrl: "publicUrl",
          tokens: [
            {
              name: "token1",
              column: "A",
              row: 1,
              colour: "red",
              size: 1,
            },
            {
              name: "token2",
              column: "Y",
              row: 5,
              colour: "blue",
              size: 0.5,
            },
          ],
        });
      });

      it("should call res with an embed response", async () => {
        await getMap({ channelId: "123", res: mockResponse });

        expect(mockJson).toBeCalledWith({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                type: "rich",
                title: "Map retrieved",
                image: {
                  url: "publicUrl",
                },
                fields: [
                  {
                    inline: true,
                    name: "token1",
                    value: "A1",
                  },
                  {
                    inline: true,
                    name: "token2",
                    value: "Y5",
                  },
                ],
              },
            ],
          },
        });
      });
    });
  });
});
