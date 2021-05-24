const _ = require("lodash");
const math = require("mathjs");
const moment = require("moment");
const { formatTimeStamp } = require("../../utils/helper");
const { analyzeTrade } = require("./analysis");

class Order {
  trades = [];
  symbols = [];
  baseAssets = 0;
  openTrades = {};
  openTradesCount = 0;
  startingBalance = 0;
  maxAllowedOpenTrades = 0;

  constructor({ maxAllowedOpenTrades, symbols, startingBalance }) {
    this.startingBalance = startingBalance || 0;
    this.maxAllowedOpenTrades = maxAllowedOpenTrades || this.symbols.length;
    this.symbols = symbols;
    for (let symbol of this.symbols) {
      this.clearTrade(symbol);
    }
  }

  clearTrade(symbol) {
    this.openTrades[symbol] = {
      symbol,
      openTime: 0,
      openRate: 0,
      closeTime: 0,
      closeRate: 0,
    };
  }

  buy({ symbol, close, closeTime }) {
    if (
      this.openTrades[symbol].openRate ||
      this.openTradesCount >= this.maxAllowedOpenTrades
    ) {
      return;
    }

    this.openTrades[symbol].openTime = closeTime;
    this.openTrades[symbol].openRate = close;
    this.openTradesCount++;

    console.log(`[${symbol}] ${formatTimeStamp(closeTime)} Buy at ${close}`);
  }

  sell({ symbol, close, closeTime }) {
    if (
      !this.openTrades[symbol].openRate ||
      this.openTrades[symbol].openTime == closeTime
    ) {
      return;
    }

    this.openTrades[symbol].closeRate = close;
    this.openTrades[symbol].closeTime = closeTime;

    let trade = this.openTrades[symbol];
    let profit =
      ((trade.closeRate - trade.openRate) / trade.openRate) * 100 - 0.3;

    this.trades.push(_.clone(this.openTrades[symbol]));
    this.clearTrade(symbol);
    this.openTradesCount--;

    console.log(
      `[${symbol}] ${formatTimeStamp(closeTime)} Sell at ${close} ${math.round(
        profit,
        2
      )}%`
    );
  }
}

module.exports = Order;
