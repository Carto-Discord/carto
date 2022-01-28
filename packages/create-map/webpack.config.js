const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("../../webpack.common.js");

module.exports = merge(common, {
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "../../assets/fonts", to: "./" }],
    }),
  ],
});
