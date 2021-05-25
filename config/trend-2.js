const moment = require("moment");

module.exports = {
  name: "TrendStrategy2",
  symbols: ["XRPUSDT", "MBLUSDT", "ONGUSDT", "BLZUSDT", "PERPUSDT"],

  baseAsset: "USDT",
  startingBalance: 60,
  maxAllowedOpenTrades: 5,

  startTime: moment("20210501").utc().valueOf(),
  endTime: moment("20210522").utc().valueOf(),
};
