const path = require("path");

module.exports = {
  moduleNameMapper: {
    "^@carto/map-utils$": path.join(__dirname, "../map-utils"),
  },
  transform: {
    "^.+\\.ts?$": ["@swc/jest"],
  },
};
