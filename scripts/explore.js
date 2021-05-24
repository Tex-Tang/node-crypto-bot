const symbols = require("../exchange/symbols");
const FileDB = require("../utils/filedb");
const { formatTimeStamp } = require("../utils/helper");

let symbol = ["BAKEUSDT"];
const file = new FileDB();

let candles = file.read(symbol, "5m").candles;

let count = 0;
let profitCandlesIdx = [];

let lossCandlesIdx = [];
let indCandlesIdx = [];
for (let i = 0; i < candles.length - 1; i++) {
  for (let j = i + 1; j < i + 30 && j < candles.length; j++) {
    let diff = (candles[j].low - candles[i].close) / candles[i].close;
    if (diff < -0.1) {
      lossCandlesIdx.push(i);
      break;
    }
    diff = (candles[j].high - candles[i].close) / candles[i].close;
    if (diff > 0.02) {
      profitCandlesIdx.push(i);
      break;
    }
  }
}

for (let i = 0; i < candles.length - 1; i++) {
  if (i > 15) {
    let maxIncrease = candles
      .slice(i - 15, i + 1)
      .map(({ close, open }) => close - open);
  }
}
