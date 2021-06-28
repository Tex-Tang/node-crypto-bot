const moment = require("moment");

module.exports = {
  name: "TrendStrategy",
  symbols: ["LTCUSDT", "MATICUSDT"],

  baseAsset: "USDT",
  startingBalance: 24,
  maxAllowedOpenTrades: 2,

  startTime: moment("20210501").utc().valueOf(),
};
