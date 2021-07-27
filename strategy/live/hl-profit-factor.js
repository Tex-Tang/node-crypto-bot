const math = require("mathjs");
const moment = require("moment");
const tulind = require("tulind");
const { formatTimeStamp } = require("../../utils/helper");

module.exports = async function (symbol, df, order, mode = "backtest") {
  let interval = "5m";
  let candles = await df.getCandles(symbol, interval, 100);

  let takingProfit = 0;
  let stopLoss = 0;

  df.subscribe(symbol, interval, async (candle) => {
    candles.push(candle);
    candles.shift();
    if (candles.length < 25) return;

    let runningMax = math.max(...candles.slice(candles.length - 22, candles.length - 1).map(({ close }) => close));
    let runningMin = math.min(...candles.slice(candles.length - 22, candles.length - 1).map(({ close }) => close));

    let trigger = (candle.close - candle.open) / (runningMax - runningMin);

    let openRate = order.openTrades[symbol].openRate;
    if (trigger > 0.8 && !openRate) {
      await order.buy({ symbol, ...candle });
      openRate = order.openTrades[symbol].openRate;
      stopLoss = openRate * (1 - 1 / 100);
      takingProfit = openRate * (1 + 2 / 100);
    }

    if (openRate) {
      let currentProfitRate = ((candle.close - openRate) / openRate) * 100;
      if (currentProfitRate > 0.5) {
        stopLoss = openRate;
      }

      if (candle.close > takingProfit) {
        await order.sell({ symbol, ...candle });
      }

      if (candle.close < stopLoss) {
        await order.sell({ symbol, ...candle, close: stopLoss });
      }
    }

    if (mode == "backtest") {
      if (candle.low < stopLoss) {
        await order.sell({ symbol, ...candle, close: stopLoss });
      }
    }
  });

  df.subscribe(symbol, "live", async (ticker) => {
    if (order.openTrades[symbol].openRate) {
      if (stopLoss > order.openTrades[symbol].openRate) {
        await order.sell({
          symbol,
          closeTime: ticker.closeTime,
          close: ticker.bestBid,
        });
      }
    }
  });
};
