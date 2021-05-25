const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("UP") && !s.includes("DOWN"));

module.exports = {
  name: "HL",
  symbols: symbols,

  baseAsset: "USDT",
  startingBalance: 80,
  maxAllowedOpenTrades: symbols.length,

  startTime: moment("20210516").utc().valueOf(),
  endTime: moment("20210523").utc().valueOf(),
};
