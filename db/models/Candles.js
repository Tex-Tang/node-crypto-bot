const Model = require("./index");

class CandleModel extends Model {
  static get tableName() {
    return "candles";
  }
}

module.exports = CandleModel;
