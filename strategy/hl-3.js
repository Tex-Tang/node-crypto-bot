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

const df = new DataFeed({ startTime: moment("20210201").utc().valueOf() });
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
            [
              candles.map((close) => {
                close;
              }),
            ],
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

        let trigger = (candle.close - candle.open) / (runningMax - runningMin);

        if (!order.openTrades[symbol].openRate && trigger > 0.5) {
          order.buy({ symbol, ...candle });
          stopLoss = -0.1;
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
              order.openTrades[symbol].openRate -
            0.002;

          let changeStopLoss = 0;
          if (profit > 0.02) {
            changeStopLoss = (math.floor(profit / 0.02) - 1) * 0.02;
          } else {
            changeStopLoss = -0.1;
          }
          if (changeStopLoss > stopLoss) stopLoss = changeStopLoss;
        }
      }
    });
  })();
}

df.run().then(() => analyzeTrade(symbols, order.trades));
