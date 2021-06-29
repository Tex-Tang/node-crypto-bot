const math = require("mathjs");
const moment = require("moment");
const tulind = require("tulind");
const { formatTimeStamp } = require("../../utils/helper");

module.exports = async function (symbol, df, order, mode = "backtest") {
  let interval = "15m";
  let stopLoss = -0.1;

  let period = {
    ema: 20,
    atr: 20,
    uptrend: 10,
  };
  let kcMax = 1.5;
  let kcMin = 1.5;

  let candles = await df.getCandles(symbol, interval, 100);
  df.subscribe(symbol, interval, async (candle) => {
    candles.push(candle);
    candles.shift();
    if (mode == "backtest") {
      let openRate = order.openTrades[symbol].openRate;
      let lowestProfit = (candle.low - openRate) / openRate;
      if (lowestProfit < stopLoss) {
        order.sell({ symbol, ...candle, close: openRate * (1 + stopLoss) });
      }
    }

    const trueRange = () => {
      let tr = [0];
      for (let i = 1; i < candles.length; i++) {
        tr.push(
          math.max(
            candles[i].high - candles[i].low,
            math.abs(candles[i].high - candles[i - 1].close),
            math.abs(candles[i].low - candles[i - 1].close)
          )
        );
      }
      return tr;
    };

    let close = candles.map(({ close }) => close);

    let [ema, atr] = await new Promise((resolve) => {
      tulind.indicators.ema.indicator([close], [period.ema], (err, results) => {
        let ema = results[0];
        tulind.indicators.ema.indicator(
          [trueRange()],
          [period.atr],
          (err, results) => {
            let atr = results[0];
            resolve([ema, atr]);
          }
        );
      });
    });

    let uptrend = true;
    for (
      let i = candles.length - period.uptrend - 1;
      i < candles.length - 1;
      i++
    ) {
      if (ema[i] > ema[i + 1]) {
        uptrend = false;
        break;
      }
    }

    let buySignal =
      uptrend &&
      candle.close > ema[ema.length - 1] &&
      candle.close < ema[ema.length - 1] + kcMax * atr[atr.length - 1];

    let sellSignal =
      candle.close <= ema[ema.length - 1] - kcMin * atr[atr.length - 1];

    if (buySignal) order.buy({ symbol, ...candle });
    if (sellSignal && !buySignal) {
      order.sell({ symbol, ...candle });
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
