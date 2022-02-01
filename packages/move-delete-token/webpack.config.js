const path = require("path");
const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const common = require("../../webpack.common.js");

module.exports = merge(common, {
  resolve: {
    extensions: [".js", ".json", ".ts"],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    path: path.join(__dirname, "dist"),
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "../../assets/fonts", to: "./" }],
    }),
  ],
});
