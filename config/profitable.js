const moment = require("moment");
let symbols = require("../exchange/symbols");
symbols = symbols.filter((s) => !s.includes("DOWN") && !s.includes("UP"));
module.exports = {
  symbols: ["SLPUSDT"],
  startingBalance: 80,
  maxAllowedOpenTrades: symbols.length,
  startTime: moment("20210201").utc().valueOf(),
  endTime: moment("20210523").utc().valueOf(),
};
