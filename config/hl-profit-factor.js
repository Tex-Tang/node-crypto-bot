const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("UP") && !s.includes("DOWN"));

module.exports = {
  name: "HL",
  symbols: [
    "SHIBUSDT",
    "BNBUSDT",
    "DOCKUSDT",
    "WINUSDT",
    "KAVAUSDT",
    "CHZUSDT",
    "REEFUSDT",
    "DATAUSDT",
    "ETHUSDT",
    "SXPUSDT",
    "HIVEUSDT",
  ],

  baseAsset: "USDT",
  startingBalance: 72,
  maxAllowedOpenTrades: 6,
  qtyPerTrade: 12,

  startTime: moment("20210701").utc().valueOf(),
};
