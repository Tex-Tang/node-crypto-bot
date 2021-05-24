const Model = require("./index");

class ExchangeInfoModel extends Model {
  static get tableName() {
    return "exchange_info";
  }
}

module.exports = ExchangeInfoModel;
