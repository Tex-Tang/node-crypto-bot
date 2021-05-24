const symbols = require("../exchange/symbols");
const FileDB = require("../utils/filedb");
const { formatTimeStamp } = require("../utils/helper");

const file = new FileDB();

let results = [];

for (let symbol of symbols) {
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

  results.push([
    symbol,
    candles.length,
    profitCandlesIdx.length,
    lossCandlesIdx.length,
    profitCandlesIdx.length / candles.length,
  ]);
}

results.sort((a, b) => a[4] - b[4]);
results.map((result) => console.log(result));
