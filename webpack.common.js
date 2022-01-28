const path = require("path");
const swcOptions = require("../../.swcrc.json");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  resolve: {
    extensions: [".js", ".json", ".ts"],
    alias: {
      "@carto/map-utils": path.resolve(__dirname, "../map-utils"),
      "@carto/token-utils": path.resolve(__dirname, "../token-utils"),
    },
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "dist"),
    filename: "index.js",
  },
  target: "node",
  optimization: {
    usedExports: true,
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        // Include ts files.
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
          options: swcOptions,
        },
      },
      {
        test: /\.node$/,
        use: "node-loader",
      },
    ],
  },
};