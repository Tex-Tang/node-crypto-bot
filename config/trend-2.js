const moment = require("moment");

module.exports = {
  name: "TrendStrategy2",
  symbols: ["MBLUSDT", "BLZUSDT", "PERPUSDT"],

  baseAsset: "USDT",
  startingBalance: 36,
  maxAllowedOpenTrades: 3,

  startTime: moment("20210501").utc().valueOf(),
  endTime: moment("20210522").utc().valueOf(),
};
