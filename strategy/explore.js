const tulind = require("tulind");
const math = require("mathjs");
const moment = require("moment");
const DataFeed = require("../shared/backtest/datafeed");
const Order = require("../shared/backtest/order");
const { analyzeTrade } = require("../shared/backtest/analysis");
let symbols = require("../exchange/symbols");
const { formatTimeStamp } = require("../utils/helper");
const FileDB = require("../utils/filedb");
symbols = ["BTCUSDT"];

const df = new DataFeed({
  startTime: moment("20210515").utc().valueOf(),
  endTime: moment("20210523").utc().valueOf(),
});
const order = new Order({
  maxAllowedOpenTrades: symbols.length,
  symbols,
  startingBalance: 500,
});

const file = new FileDB();
let candles = file.read("ETHUSDT", "5m").candles;

let profitCandlesIdx = [];
for (let i = 0; i < candles.length; i++) {
  profitCandlesCount = 0;
  for (let j = i + 1; j < i + 30 && j < candles.length; j++) {
    let diff = (candles[j].close - candles[i].close) / candles[i].close - 0.002;
    if (diff > 0.005) {
      profitCandlesIdx.push(i);
      i = j;
      break;
    }
  }
}
console.log(
  `From ${formatTimeStamp(candles[0].openTime)} to ${formatTimeStamp(
    candles[candles.length - 1].closeTime
  )}`
);
console.log(candles.length, profitCandlesIdx.length);
let period = 14;
tulind.indicators.sma.indicator(
  [candles.map(({ close }) => close)],
  [period],
  (err, results) => {
    let sma = [...Array(period - 1).fill(0), ...results[0]];
    let diff = [];
    let tests = {};
    tests["diff"] = { all: 0, trade: 0 };
    for (let i = 30; i < candles.length; i++) {
      let diff = [];
      for (let j = i - 20; j <= i; j++) {
        diff.push(candles[j].close - sma[j]);
      }
      if (diff[diff.length - 1] == math.min(...diff)) {
        tests.diff.all++;
        if (profitCandlesIdx.includes(i)) {
          tests.diff.trade++;
        }
      }
    }
    tests["min"] = { all: 0, trade: 0 };
    for (let i = 30; i < candles.length; i++) {
      let diff = [];
      if (
        candles[i].close ==
        math.min(...candles.slice(i - 20, i + 1).map(({ close }) => close))
      ) {
        tests.min.all++;
        if (profitCandlesIdx.includes(i)) {
          tests.min.trade++;
        }
      }
    }

    console.log(tests);
  }
);
