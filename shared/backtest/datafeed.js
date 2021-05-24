const math = require("mathjs");
const moment = require("moment");
const FileDB = require("../../utils/filedb");

class DataFeed {
  subscription = [];
  constructor({ startTime, endTime }) {
    this.startTime = startTime;
    this.endTime = endTime || moment().utc().valueOf();
    this.file = new FileDB();
  }

  async etCandles(symbol, interval, limit) {
    let allCandles = this.file.read(symbol, interval).candles;
    let endIndex = 0;
    for (let i in allCandles) {
      if (allCandles[i].openTime > this.startTime) {
        endIndex = i;
        break;
      }
    }
    let startIndex = math.max(endIndex - limit, 0);
    return allCandles.slice(startIndex, endIndex);
  }

  subscribe(symbol, interval, cb) {
    if (!this.subscription[symbol]) this.subscription[symbol] = {};
    if (!this.subscription[symbol][interval])
      this.subscription[symbol][interval] = [];
    this.subscription[symbol][interval].push(cb);
  }

  async run() {
    console.log("Start backtesting...");
    let candles = {};
    for (let symbol in this.subscription) {
      for (let interval in this.subscription[symbol]) {
        if (interval == "live") continue;
        this.file.read(symbol, interval).candles.map((candle) => {
          if (
            candle.openTime > this.startTime &&
            candle.openTime < this.endTime
          ) {
            if (!candles[candle.openTime]) candles[candle.openTime] = {};
            if (!candles[candle.openTime][symbol])
              candles[candle.openTime][symbol] = {};
            candles[candle.openTime][symbol][interval] = candle;
          }
        });
      }
    }
    console.log("Data loaded");
    let timeSeries = Object.keys(candles).sort();

    for (let time of timeSeries) {
      for (let symbol in this.subscription) {
        for (let interval in this.subscription[symbol]) {
          if (candles[time][symbol] && candles[time][symbol][interval]) {
            for (let cb of this.subscription[symbol][interval]) {
              await cb(candles[time][symbol][interval]);
            }
          }
        }
      }
    }
  }
}

module.exports = DataFeed;
