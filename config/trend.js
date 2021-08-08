const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("UP") && !s.includes("DOWN"));

module.exports = {
  name: "TrendStrategy",
  symbols: symbols,

  baseAsset: "USDT",
  startingBalance: 120,
  maxAllowedOpenTrades: 10,
  qtyPerTrade: 12,

  startTime: moment("20210701").utc().valueOf(),
};
