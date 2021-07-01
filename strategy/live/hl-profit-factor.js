const math = require("mathjs");
const moment = require("moment");
const tulind = require("tulind");

module.exports = async function (symbol, df, order, mode = "backtest") {
  let interval = "5m";
  let candles = await df.getCandles(symbol, interval, 100);

  let takingProfit = 0;
  let stopLoss = 0;

  df.subscribe(symbol, interval, async (candle) => {
    candles.push(candle);
    candles.shift();
    if (candles.length < 25) return;

    let runningMax = math.max(...candles.slice(candles.length - 22, candles.length - 2).map(({ close }) => close));
    let runningMin = math.min(...candles.slice(candles.length - 22, candles.length - 2).map(({ close }) => close));

    let trigger = (candle.close - candle.open) / (runningMax - runningMin);

    let openRate = order.openTrades[symbol].openRate;
    if (trigger > 0.8 && !openRate) {
      order.buy({ symbol, ...candle });
      stopLoss = candle.close * (1 - 1.5 / 100);
      takingProfit = candle.close * (1 + 2.5 / 100);
    }

    if (openRate) {
      if (candle.close > takingProfit) {
        order.sell({ symbol, ...candle, close: takingProfit });
      }

      if (candle.close < stopLoss) {
        order.sell({ symbol, ...candle, close: stopLoss });
      }
    }

    if (mode == "backtest") {
      if (candle.low < stopLoss) {
        order.sell({ symbol, ...candle, close: stopLoss });
      }
    }
  });

  df.subscribe(symbol, "live", async (ticker) => {
    if (order.openTrades[symbol].openRate) {
      if (stopLoss < order.openTrades[symbol].openRate) {
        order.sell({
          symbol,
          closeTime: ticker.closeTime,
          close: ticker.bestBid,
        });
      }
    }
  });
};
