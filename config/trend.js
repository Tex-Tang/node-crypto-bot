const moment = require("moment");

module.exports = {
  name: "TrendStrategy",
  symbols: [
    "LTCUSDT",
    "MATICUSDT",
    "ETHDOWNUSDT",
    "ADADOWNUSDT",
    "MBLUSDT",
    "BLZUSDT",
    "PERPUSDT",
    "SXPDOWNUSDT",
    "1INCHDOWNUSDT",
    "BNBDOWNUSDT",
    "AAVEDOWNUSDT",
  ],

  baseAsset: "USDT",
  startingBalance: 108,
  maxAllowedOpenTrades: 9,
  qtyPerTrade: 12,

  startTime: moment("20210701").utc().valueOf(),
};
