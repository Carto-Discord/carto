const path = require("path");
const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("../../webpack.common.js");

module.exports = merge(common, {
  output: {
    path: path.join(__dirname, "dist"),
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "../../assets/fonts", to: "./" }],
    }),
  ],
});
