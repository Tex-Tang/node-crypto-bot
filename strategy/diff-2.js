const tulind = require("tulind");
const math = require("mathjs");
const moment = require("moment");
const DataFeed = require("../shared/backtest/datafeed");
const Order = require("../shared/backtest/order");
const { analyzeTrade } = require("../shared/backtest/analysis");
let symbols = require("../exchange/symbols");
const { formatTimeStamp } = require("../utils/helper");
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
const interval = "1m";

for (let symbol of symbols) {
  (async () => {
    let candles = df.getCandles(symbol, interval, 100);

    let uptrend = false;
    let downtrend = false;
    let period = 42;
    let upcandles = 0;
    let downcandles = 0;
    let stopLoss = -0.05;
    df.subscribe(symbol, "1m", async (candle) => {
      if (order.openTrades[symbol].openRate) {
        let diff =
          (candle.low - order.openTrades[symbol].openRate) /
          order.openTrades[symbol].openRate;
        if (diff < stopLoss) {
          order.sell({
            symbol,
            ...candle,
            close: order.openTrades[symbol].openRate * (1 + stopLoss),
          });
        }
      }
      candles.push(candle);
      candles.shift();

      if (candles.length > period + 1) {
        let sma = await new Promise((resolve) => {
          tulind.indicators.sma.indicator(
            [candles.map(({ close }) => close)],
            [period],
            (err, results) => {
              resolve([...Array(period - 1).fill(0), ...results[0]]);
            }
          );
        });
        let diff = [];
        let move = [];
        for (let i = candles.length - 14; i < candles.length; i++) {
          diff.push(candles[i].close - sma[i]);
          move.push(
            math.abs((candles[i].close - candles[i].open) / candles[i].open)
          );
        }
        let currentDiff = diff[diff.length - 1];
        let rate = math.abs((candle.close - candle.open) / candle.open);

        if (currentDiff == math.min(...diff)) {
          downcandles++;
          upcandles = 0;
        }

        if (downcandles >= 3) {
          if (
            candle.close - candle.open > 0 &&
            rate > math.quantileSeq(move, [0.2])[0] &&
            rate < math.quantileSeq(move, [0.7])[0] &&
            !order.openTrades[symbol].openRate
          ) {
            order.buy({ symbol, ...candle });
            stopLoss = -0.05;
            downcandles = 0;
          }
        }

        if (
          currentDiff > math.quantileSeq(diff, [0.8])[0] &&
          rate > math.quantileSeq(move, [0.3])[0]
        ) {
          upcandles++;
          downcandles = 0;
        }

        if (order.openTrades[symbol].openRate) {
          let profit =
            (candle.close - order.openTrades[symbol].openRate) /
              order.openTrades[symbol].openRate -
            0.002;

          if (profit > 0.005 || downcandles > 2) {
            order.sell({ symbol, ...candle });
          }
          if (profit > 0) {
            stopLoss = profit - 0.005;
          }
        }
      }
    });
  })();
}

df.run().then(() => analyzeTrade(symbols, order.trades));
