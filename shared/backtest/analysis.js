const Table = require("cli-table");
const { outputFileSync } = require("fs-extra");
const _ = require("lodash");
const math = require("mathjs");
const moment = require("moment");
const { resolve } = require("path");
const { formatTimeStamp } = require("../../utils/helper");

function analyzeTrade(symbols, allTrades) {
  const headers = [
    "Symbol",
    "Win",
    "Lose",
    "Draw",
    "Win Rate",
    "Avg Profit",
    "Median Profit",
    "Max Profit",
    "Total",
    "Average Holding Time",
  ];
  const table = new Table({
    head: headers,
  });

  allTrades = allTrades.map((trade) => {
    trade.diff = math.round(
      ((trade.closeRate - trade.openRate) / trade.openRate) * 100 - 0.2,
      8
    );
    return trade;
  });

  let sumTotal = 0;

  for (let symbol of symbols) {
    let trades = allTrades.filter((t) => t.symbol == symbol);
    let total = trades.reduce((s, t) => (s += t.diff), 0);
    let win = trades.filter((t) => t.diff > 0).length;
    let avgHoldingTime =
      trades.reduce((s, t) => {
        s += moment(t.closeTime).diff(moment(t.openTime), "hours");
        return s;
      }, 0) / trades.length;
    let maxDiff = math.max(...trades.map(({ diff }) => diff), 0);
    let medianDiff = math.median(...trades.map(({ diff }) => diff), 0);
    table.push([
      symbol,
      win,
      trades.filter((t) => t.diff < 0).length,
      trades.filter((t) => t.diff == 0).length,
      trades.length ? math.round((win / trades.length) * 100, 2) : 0,
      math.round(total / trades.length, 2),
      math.round(medianDiff, 2),
      math.round(maxDiff, 2),
      math.round(total, 2),
      math.round(avgHoldingTime, 2),
    ]);
    sumTotal += trades.length ? total : 0;
  }
  table.sort((a, b) => a[5] - b[5]);
  console.log(table.toString());
  console.log("Trade count: " + allTrades.length);
  console.log("Total: " + sumTotal);
  console.log("Overall : " + sumTotal / symbols.length);

  outputFileSync(
    resolve(
      __dirname,
      `../../backtest_results/${moment().utc().valueOf()}-result.csv`
    ),
    headers.join(",") + "\n" + table.map((row) => row.join(",")).join("\n")
  );

  outputFileSync(
    resolve(
      __dirname,
      `../../backtest_results/${moment().utc().valueOf()}-trades.csv`
    ),
    ["Symbol", "Open Time", "Close Time", "Open Rate", "Close Rate"].join(",") +
      "\n" +
      allTrades
        .map((trade) => {
          return [
            trade.symbol,
            formatTimeStamp(trade.openTime),
            formatTimeStamp(trade.closeTime),
            trade.openRate,
            trade.closeRate,
          ].join(",");
        })
        .join("\n")
  );
}

module.exports = {
  analyzeTrade,
};
