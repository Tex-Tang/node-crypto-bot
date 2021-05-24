const math = require("mathjs");
const moment = require("moment");

module.exports = async function (symbol, df, order, mode = "backtest") {
  let interval = "5m";
  let stopLoss = -0.1;
  let candles = df.getCandles(symbol, interval, 50);
  df.subscribe(symbol, interval, async (candle) => {
    candles.push(candle);
    candles.shift();

    let openRate = order.openTrades[symbol].openRate;
    if (mode == "backtest" && openRate) {
      let lowestProfit = (candle.low - openRate) / openRate;
      if (lowestProfit < stopLoss) {
        order.sell({ symbol, ...candle, close: openRate * (1 + stopLoss) });
      }
    }

    order.buy({ symbol, ...candle });

    if (openRate) {
      let profit = (candle.high - openRate) / openRate;
      if (profit > 0.02) {
        order.sell({ symbol, ...candle });
      }
    }
  });
};
