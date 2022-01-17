import axios from "axios";
import type { MessageEmbed } from "discord.js";

import { handler, Event } from "../src/index";

jest.mock("axios");

describe("Handler", () => {
  const event: Event = {
    application_id: "app-id-123",
    token: "mockToken",
    embed: {
      title: "Success",
      fields: [
        {
          name: "field1",
          value: "value1",
          inline: true,
        },
      ],
      image: {
        url: "https://image.url",
      },
    } as MessageEmbed,
  };

  beforeEach(() => {
    process.env.BASE_URL = "https://discord.com/api/v9";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should PATCH the discord webhook endpoint", async () => {
    await handler(JSON.stringify(event));

    expect(axios.patch).toBeCalledWith(
      "https://discord.com/api/v9/webhooks/app-id-123/mockToken/messages/@original",
      {
        embeds: [
          {
            title: "Success",
            fields: [
              {
                name: "field1",
                value: "value1",
                inline: true,
              },
            ],
            image: {
              url: "https://image.url",
            },
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );
  });

  describe("given an error is sent", () => {
    it("should PATCH the discord webhook endpoint with an error", async () => {
      const event: Event = {
        application_id: "app-id-123",
        token: "mockToken",
        error: "Something went wrong",
      };

      await handler(JSON.stringify(event));

      expect(axios.patch).toBeCalledWith(
        "https://discord.com/api/v9/webhooks/app-id-123/mockToken/messages/@original",
        {
          embeds: [
            {
              title: "Command execution failed",
              description:
                "The command failed to process, likely due to an internal error.",
              type: "rich",
            },
          ],
        },
        { headers: { "Content-Type": "application/json" } }
      );
    });
  });
});
