const path = require("path");
const { merge } = require("webpack-merge");
const common = require("../../webpack.common.js");

module.exports = merge(common, {
  output: {
    path: path.join(__dirname, "dist"),
  },
  optimization: {
    usedExports: true,
    minimize: false,
  },
  resolve: {
    extensions: [".js", ".json", ".ts"],
    mainFields: ["main"],
  },
  externals: {
    bufferutil: "bufferutil",
    erlpack: "erlpack",
    "utf-8-validate": "utf-8-validate",
    "zlib-sync": "zlib-sync",
  },
});
