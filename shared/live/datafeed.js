const math = require("mathjs");
const moment = require("moment");
const client = require("../client");
const { formatTimeStamp } = require("../../utils/helper");

class DataFeed {
  subscription = [];
  constructor() {
    this.client = client;
  }

  async getCandles(symbol, interval, limit) {
    let candles = await this.client.candles({ symbol, interval, limit });
    return candles.map((c) => {
      return {
        symbol,
        openTime: c.openTime,
        closeTime: c.closeTime,
        open: math.round(c.open, 8),
        high: math.round(c.high, 8),
        low: math.round(c.low, 8),
        close: math.round(c.close, 8),
        volume: math.round(c.volume, 8),
      };
    });
  }

  log(msg) {
    console.log(`${formatTimeStamp(moment().utc().valueOf())} ${msg}`);
  }

  subscribe(symbol, interval, cb) {
    this.log(`[${symbol}] Subscribe to ${interval}`);
    if (interval == "live") {
      client.ws.ticker(symbol, (c) => {
        cb({
          symbol: c.symbol,
          open: math.round(c.open, 8),
          high: math.round(c.high, 8),
          low: math.round(c.low, 8),
          volume: math.round(c.volume, 8),
          bestBid: math.round(c.bestBid, 8),
          bestAsk: math.round(c.bestAsk, 8),
        });
      });
    } else {
      client.ws.candles(symbol, interval, (c) => {
        if (!c.isFinal) return;
        this.log(`[${symbol}] Update candle ${formatTimeStamp(c.closeTime)}`);
        cb({
          symbol,
          openTime: c.openTime,
          closeTime: c.closeTime,
          open: math.round(c.open, 8),
          high: math.round(c.high, 8),
          low: math.round(c.low, 8),
          close: math.round(c.close, 8),
          volume: math.round(c.volume, 8),
        });
      });
    }
  }
}

module.exports = DataFeed;
