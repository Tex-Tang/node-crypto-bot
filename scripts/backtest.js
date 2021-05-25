const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const DataFeed = require("../shared/backtest/datafeed");
const Order = require("../shared/backtest/order");
const { analyzeTrade } = require("../shared/backtest/analysis");
const { s, c } = yargs(hideBin(process.argv)).argv;

const config = require("../config/" + c);
const run = require("../strategy/" + s);
const df = new DataFeed(config);
const order = new Order(config);

async function main() {
  for (let symbol of config.symbols) {
    await run(symbol, df, order);
  }

  df.run().then(() => analyzeTrade(config.symbols, order.trades));
}

main();
