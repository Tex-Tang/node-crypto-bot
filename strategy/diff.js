const tulind = require("tulind");
const math = require("mathjs");
const moment = require("moment");
const DataFeed = require("../shared/backtest/datafeed");
const Order = require("../shared/backtest/order");
const { analyzeTrade } = require("../shared/backtest/analysis");
let symbols = require("../exchange/symbols");
symbols = ["BTCUSDT"];

const df = new DataFeed({
  startTime: moment("20210520").utc().valueOf(),
  endTime: moment("20210523").utc().valueOf(),
});
const order = new Order({
  maxAllowedOpenTrades: symbols.length,
  symbols,
  startingBalance: 500,
});
const interval = "15m";
const stopLoss = -0.1;

for (let symbol of symbols) {
  (async () => {
    let candles = df.getCandles(symbol, interval, 100);

    let uptrend = false;
    let downtrend = false;
    let upcandles = 0;
    let downcandles = 0;
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

      if (candle.close > candle.open) {
        upcandles++;
      } else {
        downcandles++;
      }
      if (!order.openTrades[symbol].openRate && downtrend) {
        if (upcandles >= 3) {
          order.buy({ symbol, ...candle });
        }
      }

      if (order.openTrades[symbol].openRate) {
        let diff =
          (candle.close - order.openTrades[symbol].openRate) /
            order.openTrades[symbol].openRate -
          0.002;
        if (downcandles >= 3 && downtrend) {
          order.sell({ symbol, ...candle });
        }
        if (downcandles >= 2 && uptrend) {
          order.sell({ symbol, ...candle });
        }
      }
    });
    df.subscribe(symbol, "5m", async (candle) => {
      candles.push(candle);
      candles.shift();

      if (candles.length > 25) {
        let sma = await new Promise((resolve) => {
          tulind.indicators.sma.indicator(
            [candles.map(({ close }) => close)],
            [14],
            (err, results) => {
              resolve([...Array(13).fill(0), ...results[0]]);
            }
          );
        });
        let diff = [];
        let move = [];
        for (let i = candles.length - 10; i < candles.length; i++) {
          diff.push(candles[i].close - sma[i]);
          move.push(
            math.abs((candles[i].close - candles[i].open) / candles[i].open)
          );
        }

        downtrend =
          diff[diff.length - 1] == math.min(...diff) &&
          candle.open < sma[sma.length - 1];
        uptrend = diff[diff.length - 1] == math.max(...diff);
        if (
          math.abs((candle.close - candle.open) / candle.open) <
          math.mean(...move)
        ) {
          downtrend = uptrend = false;
        }
      }

      upcandles = downcandles = 0;
    });
  })();
}

df.run().then(() => analyzeTrade(symbols, order.trades));
