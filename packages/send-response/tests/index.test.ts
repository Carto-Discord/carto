import axios from "axios";
import type { MessageEmbed } from "discord.js";

import { handler } from "../src/index";

jest.mock("axios");

describe("Handler", () => {
  const event = {
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
    },
  } as { application_id: string; token: string; embed: MessageEmbed };

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
});
