const Model = require("./index");

class TradeModel extends Model {
  static get tableName() {
    return "trades";
  }
}

module.exports = TradeModel;
