const moment = require("moment");

module.exports = {
  name: "TrendStrategy",
  symbols: ["LTCUSDT", "MATICUSDT", "ETHDOWNUSDT", "ADADOWNUSDT"],

  baseAsset: "USDT",
  startingBalance: 25,
  maxAllowedOpenTrades: 3,

  startTime: moment("20210501").utc().valueOf(),
};
