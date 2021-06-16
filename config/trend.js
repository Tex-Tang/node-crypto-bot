const moment = require("moment");

module.exports = {
  name: "TrendStrategy",
  symbols: ["LTCUSDT", "MATICUSDT", "XRPUSDT"],

  baseAsset: "USDT",
  startingBalance: 35,
  maxAllowedOpenTrades: 3,

  startTime: moment("20210501").utc().valueOf(),
};
