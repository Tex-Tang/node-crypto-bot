const avro = require("avsc");
const math = require("mathjs");
const { existsSync, readFileSync } = require("fs");
const { outputFileSync } = require("fs-extra");
const { resolve } = require("path");

class FileDB {
  constructor() {
    this.type = avro.Type.forSchema({
      type: "record",
      fields: [
        { name: "symbol", type: "string" },
        { name: "interval", type: "string" },
        {
          name: "candles",
          type: {
            type: "array",
            items: {
              name: "candle",
              type: "record",
              fields: [
                { name: "openTime", type: "long" },
                { name: "closeTime", type: "long" },
                { name: "open", type: "float" },
                { name: "high", type: "float" },
                { name: "low", type: "float" },
                { name: "close", type: "float" },
                { name: "volume", type: "float" },
              ],
            },
          },
        },
      ],
    });
  }

  write(symbolData) {
    const filepath = resolve(
      __dirname,
      `../data/${symbolData.symbol}/${symbolData.interval}`
    );
    const buf = this.type.toBuffer(symbolData);

    return outputFileSync(filepath, buf);
  }

  read(symbol, interval) {
    const filepath = resolve(__dirname, `../data/${symbol}/${interval}`);
    if (!existsSync(filepath)) {
      return null;
    }

    let content = readFileSync(filepath);
    let val = this.type.fromBuffer(content);

    if (val.candles) {
      val.candles = val.candles.map((candle) => {
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
    }
    return val;
  }
}

module.exports = FileDB;
