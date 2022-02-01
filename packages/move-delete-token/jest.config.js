const path = require("path");

module.exports = {
  moduleNameMapper: {
    "^@carto/map-utils$": path.join(__dirname, "../map-utils"),
    "^@carto/token-utils$": path.join(__dirname, "../token-utils"),
  },
};
