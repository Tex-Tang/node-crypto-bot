let symbols = require("../exchange/symbols");
symbols = ["ETHUSDT"];
const tulind = require("tulind");
const math = require("mathjs");
const moment = require("moment");
const DataFeed = require("../shared/backtest/datafeed");
const Order = require("../shared/backtest/order");
const { formatTimeStamp } = require("../utils/helper");
const { format } = require("path");
const { analyzeTrade } = require("../shared/backtest/analysis");

const df = new DataFeed({ startTime: moment("20210501").utc().valueOf() });
const order = new Order({
  maxAllowedOpenTrades: symbols.length,
  symbols,
  startingBalance: 500,
});
const interval = "5m";

for (let symbol of symbols) {
  (async () => {
    let stopLoss = -0.1;
    let candles = df.getCandles(symbol, interval, 100);
    df.subscribe(symbol, interval, async (candle) => {
      candles.push(candle);
      candles.shift();

      if (candles.length > 15) {
        let sma = await new Promise((resolve) => {
          tulind.indicators.sma.indicator(
            [candles.map(({ close }) => close)],
            [14],
            (err, results) => {
              resolve(results[0]);
            }
          );
        });

        let runningMax = math.max(
          ...candles
            .slice(candles.length - 22, candles.length - 2)
            .map(({ close }) => close)
        );
        let runningMin = math.min(
          ...candles
            .slice(candles.length - 22, candles.length - 2)
            .map(({ close }) => close)
        );

        let trigger =
          candle.close - candle.open > 0.6 * runningMax - runningMin;

        if (
          !order.openTrades[symbol].openRate &&
          candle.close < sma[sma.length - 1]
        ) {
          order.buy({ symbol, ...candle });
        }

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

        if (order.openTrades[symbol].openRate) {
          let profit =
            (candle.close - order.openTrades[symbol].openRate) /
            order.openTrades[symbol].openRate;
          if (profit > 0.02) {
            order.sell({ symbol, ...candle });
          }

          if (profit > 0) {
            stopLoss = profit - 0.002;
          }
        }
      }
    });
  })();
}

df.run().then(() => analyzeTrade(symbols, order.trades));
