const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("UP") && !s.includes("DOWN"));

module.exports = {
  name: "HL",
  symbols: [
    "ETHUSDT",
    //"BTCUSDT",
    "BNBUSDT",
    //"ADAUSDT",
    //"BNBUSDT",
    //"ADAUSDT",
    //"XRPUSDT",
    //"DOTUSDT",
    //"UNIUSDT",
    //"BCHUSDT",
    "LTCUSDT",
    "SOLUSDT",
    //"LINKUSDT",
    "MATICUSDT",
    //"THETAUSDT",
    //"XLMUSDT",
    //"ICPUSDT",
  ], //["ONGUSDT", "EOSUSDT", "ATMUSDT", "XRPUSDT"],

  baseAsset: "USDT",
  startingBalance: 60,
  maxAllowedOpenTrades: 5,

  startTime: moment("20210201").utc().valueOf(),
  endTime: moment("20210524").utc().valueOf(),
};
