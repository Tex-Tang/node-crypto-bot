const math = require("mathjs");
const Table = require("cli-table");
const moment = require("moment");
const client = require("../client");
const TradeModel = require("../../db/models/Trades");
const { formatTimeStamp } = require("../../utils/helper");

class Order {
  wallet = {};
  trades = [];
  symbols = [];
  baseAsset = "";
  openTrades = {};
  openTradesCount = 0;
  balance = 0;
  maxAllowedOpenTrades = 0;

  constructor({
    log,
    name,
    symbols,
    strategy,
    baseAsset,
    startingBalance,
    maxAllowedOpenTrades,
  }) {
    this.log = log;
    this.name = name;
    this.symbols = symbols;
    this.strategy = strategy;
    this.baseAsset = baseAsset;
    this.balance = startingBalance;
    this.maxAllowedOpenTrades = maxAllowedOpenTrades;
  }

  async init() {
    await this.updateWallet();
    let result = await client.exchangeInfo();
    this.exchangeInfo = result.symbols.filter((c) =>
      this.symbols.includes(c.symbol)
    );

    let trades = await TradeModel.query()
      .whereIn("symbol", this.symbols)
      .where("strategy", this.name)
      .where("closeTime", null);
    trades.sort((a, b) => moment(b.openTime) - moment(a.openTime));

    for (let symbol of this.symbols) {
      this.openTrades[symbol] = {
        symbol,
        openTime: 0,
        openRate: 0,
        closeRate: 0,
        closeTime: 0,
        currentRate: 0,
        stepSize: 0,
        minSize: 0,
      };
      let trade = trades.find((c) => c.symbol == symbol);
      if (trade) {
        this.openTrades[symbol].tradeId = trade.id;
        this.openTrades[symbol].quantity = trade.amount;
        this.openTrades[symbol].openTime = moment(trade.openTime)
          .utc()
          .valueOf();
        this.openTrades[symbol].openRate = trade.openRate;
        this.openTradesCount++;
        this.balance -= trade.amount * trade.openRate;
      }

      let detail = this.exchangeInfo.find((c) => c.symbol == symbol);
      this.openTrades[symbol].stepSize = -math.log10(
        detail.filters.find(({ filterType }) => filterType == "LOT_SIZE")
          .stepSize
      );

      this.openTrades[symbol].minSize = detail.filters.find(
        ({ filterType }) => filterType == "MIN_NOTIONAL"
      ).minNotional;

      client.ws.ticker(symbol, (ticker) => {
        this.openTrades[symbol].currentRate = ticker.bestBid;
      });
    }
  }

  async buy({ symbol }) {
    if (
      this.openTrades[symbol].openRate ||
      this.openTradesCount >= this.maxAllowedOpenTrades
    ) {
      this.log(`[${symbol}] Buy failed `);
      return;
    }

    try {
      let quantity = math.round(
        this.balance /
          (this.maxAllowedOpenTrades - this.openTradesCount) /
          this.openTrades[symbol].currentRate,
        this.openTrades[symbol].stepSize
      );

      let result = await client.order({
        symbol: symbol,
        side: "BUY",
        type: "MARKET",
        quantity: quantity,
      });

      let totalPrice = 0;
      let totalQty = 0;
      for (let order of result.fills) {
        totalPrice += math.round(order.price, 8) * math.round(order.qty, 8);
        totalQty += math.round(order.qty, 8);
      }

      let avgPrice = math.round(totalPrice / totalQty, 8);
      this.balance = math.round(this.balance - totalPrice, 8);

      let trade = await TradeModel.query().insert({
        strategy: this.name,
        symbol: result.symbol,
        orderId: result.orderId,
        clientOrderId: result.clientOrderId,
        amount: totalQty,
        openTime: moment(result.transactTime).utc().format(),
        openRate: avgPrice,
      });

      this.openTradesCount++;
      this.openTrades[symbol].tradeId = trade.id;
      this.openTrades[symbol].quantity = quantity;
      this.openTrades[symbol].openRate = avgPrice;
      this.openTrades[symbol].openTime = result.transactTime;
      this.log(`[${symbol}] Buy at ${avgPrice}`);
    } catch (err) {
      console.log(err);
      this.log("ERROR:", err?.message);
    }
  }

  async sell({ symbol }) {
    if (!this.openTrades[symbol].openRate) {
      this.log(`[${symbol}] Sell failed `);
      return;
    }

    try {
      let result = await client.order({
        symbol: symbol,
        side: "SELL",
        type: "MARKET",
        quantity: math.round(
          this.openTrades[symbol].quantity,
          this.openTrades[symbol].stepSize
        ),
      });

      let totalPrice = 0;
      let totalQty = 0;
      for (let order of result.fills) {
        totalPrice += math.round(order.price, 8) * math.round(order.qty, 8);
        totalQty += math.round(order.qty, 8);
      }
      let avgPrice = math.round(totalPrice / totalQty, 8);
      this.balance = math.round(this.balance + totalPrice, 8);

      await TradeModel.query()
        .where("id", this.openTrades[symbol].tradeId)
        .update({
          closeTime: moment(result.transactTime).utc().format(),
          closeRate: avgPrice,
        });

      this.openTradesCount--;
      this.openTrades[symbol].openRate = 0;
      this.openTrades[symbol].openTime = 0;
      this.openTrades[symbol].quantity = 0;
      this.log(`[${symbol}] Sell at ${avgPrice}`);
    } catch (err) {
      console.log(err);
      this.log("ERROR:", err?.message);
    }
  }

  async updateWallet() {
    let account = await client.accountInfo();
    this.wallet = account.balances.reduce((balance, asset) => {
      if (asset["free"] != 0) {
        balance[asset["asset"]] = asset["free"];
      }
      return balance;
    }, {});
    this.log("Wallet Sync.");
  }

  showResults() {
    let table = new Table({
      head: [
        "Symbol",
        "Open Time",
        "Amount",
        "Open Rate",
        "Current Rate",
        "Profit (%)",
      ],
    });
    for (let symbol in this.openTrades) {
      let openTrade = this.openTrades[symbol];
      let diff = 0;
      if (openTrade.openRate) {
        diff = math.round(
          ((openTrade.currentRate - openTrade.openRate) / openTrade.openRate) *
            100 -
            0.2,
          2
        );
      }

      table.push([
        symbol,
        formatTimeStamp(openTrade.openTime),
        openTrade.quantity,
        openTrade.openRate,
        openTrade.currentRate,
        diff,
      ]);
    }
    console.log(table.toString());
    console.log("Total Open Trades:" + this.openTradesCount);
    console.log("Total Balance: " + this.balance);
  }
}

module.exports = Order;
