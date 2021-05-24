const Model = require("./index");

class TestTradeModel extends Model {
  static get tableName() {
    return "test_trades";
  }
}

module.exports = TestTradeModel;
