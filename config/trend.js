const moment = require("moment");

module.exports = {
  name: "TrendStrategy",
  symbols: ["LTCUSDT", "MATICUSDT", "XRPUSDT"],

  baseAsset: "USDT",
  startingBalance: 36,
  maxAllowedOpenTrades: 3,

  startTime: moment("20210501").utc().valueOf(),
};
