const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("UP") && !s.includes("DOWN"));

module.exports = {
  name: "HL",
  symbols: ["ONGUSDT", "EOSUSDT", "ATMUSDT", "XRPUSDT"],

  baseAsset: "USDT",
  startingBalance: 48,
  maxAllowedOpenTrades: 4,

  startTime: moment("20210201").utc().valueOf(),
  endTime: moment("20210524").utc().valueOf(),
};
