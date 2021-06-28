const math = require("mathjs");
const moment = require("moment");
const tulind = require("tulind");

module.exports = async function (symbol, df, order, mode = "backtest") {
  let interval = "5m";
  let stopLoss = -0.01;
  let threeHoursStopLoss = -0.01;
  let tp = 0.2;
  let candles = await df.getCandles(symbol, interval, 100);
  let candles1h = await df.getCandles(symbol, "1h", 150);
  df.subscribe(symbol, interval, async (candle) => {
    candles.push(candle);
    candles.shift();
    if (candles.length < 25) return;

    let sma150 = await new Promise((r) => {
      tulind.indicators.sma.indicator([candles1h.map(({ close }) => close)], [150], (err, results) => {
        r(results[0][0]);
      });
    });

    let runningMax = math.max(...candles.slice(candles.length - 22, candles.length - 2).map(({ close }) => close));
    let runningMin = math.min(...candles.slice(candles.length - 22, candles.length - 2).map(({ close }) => close));

    let trigger = (candle.close - candle.open) / (runningMax - runningMin);

    let openRate = order.openTrades[symbol].openRate;
    let openTime = order.openTrades[symbol].openTime;
    if (trigger > 0.8) {
      // && candle.close > sma150) {
      if (!openRate) {
        order.buy({ symbol, ...candle });
      }
    }

    if (openRate) {
      let profit = ((candle.close - openRate) / openRate - 0.002) * 100;
      if (profit > tp) {
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

  df.subscribe(symbol, "1h", async (candle) => {
    candles1h.push(candle);
    candles1h.shift();
  });

  df.subscribe(symbol, "live", async (ticker) => {
    if (order.openTrades[symbol].openRate) {
      let profit = (ticker.bestBid - order.openTrades[symbol].openRate) / order.openTrades[symbol].openRate;

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
/*
┌─────────┬─────┬──────┬──────┬──────────┬────────────┬───────────────┬────────────┬────────┬──────────────────────┐
│ Symbol  │ Win │ Lose │ Draw │ Win Rate │ Avg Profit │ Median Profit │ Max Profit │ Total  │ Average Holding Time │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ ATMUSDT │ 23  │ 22   │ 0    │ 51.11    │ -0.66      │ 1.54          │ 7          │ -29.78 │ 1.22                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ XRPUSDT │ 26  │ 46   │ 0    │ 36.11    │ -0.24      │ -1.2          │ 7.07       │ -17.15 │ 3.19                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ EOSUSDT │ 30  │ 50   │ 0    │ 37.5     │ -0.12      │ -1.2          │ 5.8        │ -9.69  │ 2.9                  │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ ONGUSDT │ 19  │ 14   │ 0    │ 57.58    │ 2.64       │ 3.28          │ 41.66      │ 87.12  │ 1.52                 │
└─────────┴─────┴──────┴──────┴──────────┴────────────┴───────────────┴────────────┴────────┴──────────────────────
┌─────────┬─────┬──────┬──────┬──────────┬────────────┬───────────────┬────────────┬────────┬──────────────────────┐
│ Symbol  │ Win │ Lose │ Draw │ Win Rate │ Avg Profit │ Median Profit │ Max Profit │ Total  │ Average Holding Time │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ ATMUSDT │ 30  │ 14   │ 0    │ 68.18    │ -0.4       │ 2.49          │ 7          │ -17.47 │ 1.05                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ EOSUSDT │ 41  │ 23   │ 0    │ 64.06    │ -0.27      │ 2.11          │ 5.33       │ -17.07 │ 4.36                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ XRPUSDT │ 42  │ 18   │ 0    │ 70       │ -0.01      │ 2.13          │ 3.66       │ -0.4   │ 3.85                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ ONGUSDT │ 22  │ 10   │ 0    │ 68.75    │ 2.23       │ 2.13          │ 41.66      │ 71.26  │ 1.59                 │
└─────────┴─────┴──────┴──────┴──────────┴────────────┴───────────────┴────────────┴────────┴──────────────────────┘
┌─────────┬─────┬──────┬──────┬──────────┬────────────┬───────────────┬────────────┬────────┬──────────────────────┐
│ Symbol  │ Win │ Lose │ Draw │ Win Rate │ Avg Profit │ Median Profit │ Max Profit │ Total  │ Average Holding Time │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ ATMUSDT │ 30  │ 17   │ 0    │ 63.83    │ -0.24      │ 2.33          │ 7          │ -11.48 │ 0.83                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ XRPUSDT │ 39  │ 40   │ 0    │ 49.37    │ 0          │ -0.35         │ 3.66       │ 0.25   │ 2.08                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ EOSUSDT │ 39  │ 45   │ 0    │ 46.43    │ 0.11       │ -0.7          │ 5.8        │ 9      │ 2.36                 │
├─────────┼─────┼──────┼──────┼──────────┼────────────┼───────────────┼────────────┼────────┼──────────────────────┤
│ ONGUSDT │ 21  │ 13   │ 0    │ 61.76    │ 2.08       │ 2.09          │ 41.66      │ 70.68  │ 1.12                 │
└─────────┴─────┴──────┴──────┴──────────┴────────────┴───────────────┴────────────┴────────┴──────────────────────┘
*/
