const moment = require("moment");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const DataFeed = require("../shared/live/datafeed");
const Order = require("../shared/live/order");
const { analyzeTrade } = require("../shared/backtest/analysis");
const { formatTimeStamp } = require("../utils/helper");
const { s, c } = yargs(hideBin(process.argv)).argv;

const config = require("../config/" + c);
const run = require("../strategy/" + s);
const df = new DataFeed(config);
const order = new Order({
  strategy: s,
  log: (msg) =>
    console.log(formatTimeStamp(moment().utc().valueOf()) + " " + msg),
  ...config,
});

async function main() {
  await order.init();
  for (let symbol of config.symbols) {
    run(symbol, df, order, "live");
  }

  order.showResults();
  setInterval(() => {
    order.showResults();
  }, 60 * 1000);
}

main();
//df.run().then(() => analyzeTrade(config.symbols, order.trades));
