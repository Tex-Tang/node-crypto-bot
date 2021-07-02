const moment = require("moment");

module.exports = {
  name: "TrendStrategy",
  symbols: ["LTCUSDT", "MATICUSDT", "ETHDOWNUSDT", "ADADOWNUSDT"],

  baseAsset: "USDT",
  startingBalance: 48,
  maxAllowedOpenTrades: 4,
  qtyPerTrade: 12,

  startTime: moment("20210501").utc().valueOf(),
};
