const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("UP") && !s.includes("DOWN"));

module.exports = {
  name: "HL",
  symbols: [
    "ETHUSDT",
    "BNBUSDT",
    "LTCUSDT",
    "SOLUSDT",
    "MATICUSDT",
    "SHIBUSDT",
    "DATAUSDT",
    "WINUSDT",
    "REEFUSDT",
    "CHZUSDT",
  ],

  baseAsset: "USDT",
  startingBalance: 60,
  maxAllowedOpenTrades: 5,
  qtyPerTrade: 12,

  startTime: moment("20210601").utc().valueOf(),
  endTime: moment("20210630").utc().valueOf(),
};
