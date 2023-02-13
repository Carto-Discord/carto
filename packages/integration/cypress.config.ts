import path from "path";

import { defineConfig } from "cypress";
import { ProvidePlugin } from "webpack";

import webpackPreprocessor from "@cypress/webpack-preprocessor";

export default defineConfig({
  video: false,
  defaultCommandTimeout: 10000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    setupNodeEvents(on) {
      on(
        "file:preprocessor",
        webpackPreprocessor({
          webpackOptions: {
            mode: "development",
            module: {
              rules: [
                {
                  test: /\.js$/,
                  exclude: [/node_modules/],
                  use: [
                    {
                      loader: "babel-loader",
                      options: {
                        presets: ["@babel/preset-env"],
                      },
                    },
                  ],
                },
                {
                  test: /\.ts$/,
                  exclude: [/node_modules/],
                  use: "ts-loader",
                },
              ],
            },
            resolve: {
              extensions: [".ts", ".js"],
              fallback: {
                buffer: require.resolve("buffer"),
              },
            },
            output: {
              filename: "bundle.js",
              path: path.resolve(__dirname, "dist"),
            },
            plugins: [
              new ProvidePlugin({
                Buffer: ["buffer", "Buffer"],
              }),
            ],
          },
        })
      );
    },
    baseUrl: "http://localhost:3000",
  },
});
