const path = require("path");
const swcOptions = require("../../.swcrc.json");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  resolve: {
    extensions: [".js", ".json", ".ts"],
    mainFields: ["main"],
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "dist"),
    filename: "index.js",
  },
  target: "node",
  optimization: {
    usedExports: true,
    minimize: false,
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
    ],
  },
  externals: {
    bufferutil: "bufferutil",
    erlpack: "erlpack",
    "utf-8-validate": "utf-8-validate",
    "zlib-sync": "zlib-sync",
  },
};
