const { concat } = require("lodash");
const math = require("mathjs");
const moment = require("moment");
const FileDB = require("../utils/filedb");
const { formatTimeStamp } = require("../utils/helper");
const client = require("./client");

let rateLimit = 18;
setInterval(() => {
  rateLimit = 18;
}, 1000);

class DownloadService {
  constructor() {
    this.filedb = new FileDB();
  }

  async download(symbol, interval, startTime = null) {
    const log = (msg) => console.log(`[${symbol}] ${interval} ${msg}`);

    let symbolData = this.filedb.read(symbol, interval);
    if (!symbolData) {
      symbolData = {
        symbol,
        interval,
        candles: [],
      };
    }

    startTime = startTime || moment("20210101").utc().valueOf();
    let endTime = moment().utc().valueOf();
    if (symbolData.candles.length) {
      endTime = symbolData.candles[0].openTime - 1;
    }

    let candlesToPrepend = [];
    log(
      `Downloading data from ${formatTimeStamp(startTime)} to ${formatTimeStamp(
        endTime
      )}`
    );
    while (true) {
      let candles = await this.downloadCandles(
        symbol,
        interval,
        startTime,
        endTime
      );
      if (candles == null) {
        process.exit(-1);
      }
      if (candles.length == 0) break;
      candlesToPrepend.push(...candles);
      log(
        `Downloaded data from ${formatTimeStamp(
          candles[0].openTime
        )} to ${formatTimeStamp(candles[candles.length - 1].openTime)} length=${
          candles.length
        }`
      );
      startTime = candles[candles.length - 1].closeTime;
    }
    symbolData.candles = concat(candlesToPrepend, symbolData.candles);

    startTime = symbolData.candles[symbolData.candles.length - 1].closeTime + 1;
    endTime = moment().utc().valueOf();
    let candlesToAppend = [];
    while (true) {
      let candles = await this.downloadCandles(
        symbol,
        interval,
        startTime,
        endTime
      );
      if (candles == null) {
        process.exit(-1);
      }
      if (candles.length == 0) break;
      candlesToAppend.push(...candles);
      log(
        `Downloaded data from ${formatTimeStamp(
          candles[0].openTime
        )} to ${formatTimeStamp(candles[candles.length - 1].openTime)} length=${
          candles.length
        }`
      );
      startTime = candles[candles.length - 1].closeTime;
    }
    symbolData.candles = concat(symbolData.candles, candlesToAppend);
    let file = new FileDB();
    file.write(symbolData);
    log(`Done`);
  }

  async downloadCandles(symbol, interval, startTime, endTime) {
    while (rateLimit == 0) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1);
      });
    }
    rateLimit--;
    try {
      let candles = await client.candles({
        symbol,
        interval,
        startTime,
        endTime,
      });
      return candles.map((candle) => {
        return {
          openTime: candle.openTime,
          closeTime: candle.closeTime,
          open: math.number(candle.open),
          high: math.number(candle.high),
          low: math.number(candle.low),
          close: math.number(candle.close),
          volume: math.number(candle.volume),
        };
      });
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

module.exports = DownloadService;
