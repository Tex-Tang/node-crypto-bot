const math = require("mathjs");
const moment = require("moment");

module.exports = async function (symbol, df, order, mode = "backtest") {
  let interval = "5m";
  let stopLoss = -0.1;
  let threeHoursStopLoss = -0.05;
  let candles = await df.getCandles(symbol, interval, 100);
  df.subscribe(symbol, interval, async (candle) => {
    candles.push(candle);
    candles.shift();
    if (candles.length < 25) return;

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

    let openRate = order.openTrades[symbol].openRate;
    let openTime = order.openTrades[symbol].openTime;
    if (trigger > 0.5) {
      if (!openRate) {
        order.buy({ symbol, ...candle });
        stopLoss = -0.1;
      }
    }

    if (openRate) {
      let profit = (candle.close - openRate) / openRate - 0.002;
      if (profit > 0.02) {
        order.sell({ symbol, ...candle });
      }

      if (moment(candle.closeTime).diff(moment(openTime), "hours") >= 3) {
        if (mode == "backtest") {
          // First time
          if (stopLoss != threeHoursStopLoss) {
            stopLoss = threeHoursStopLoss;
            let profit = (candle.close - openRate) / openRate;
            if (profit < stopLoss) {
              order.sell({ symbol, ...candle });
            }
          }
        }
        if (stopLoss != threeHoursStopLoss) {
          stopLoss = threeHoursStopLoss;
        }
      }
    }

    if (mode == "backtest") {
      let lowestProfit = (candle.low - openRate) / openRate;
      if (lowestProfit < stopLoss) {
        order.sell({ symbol, ...candle, close: openRate * (1 + stopLoss) });
      }
    }
  });

  df.subscribe(symbol, "live", async (ticker) => {
    if (order.openTrades[symbol].openRate) {
      let profit =
        (ticker.bestBid - order.openTrades[symbol].openRate) /
        order.openTrades[symbol].openRate;

      if (profit < stopLoss) {
        order.sell({
          symbol,
          closeTime: ticker.closeTime,
          close: ticker.bestBid,
        });
      }
    }
  });
};
