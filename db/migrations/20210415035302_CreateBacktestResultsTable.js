exports.up = function (knex) {
  return knex.schema.createTable("backtest_results", function (table) {
    table.increments();
    table.string("symbol");
    table.string("strategy");
    table.jsonb("parameters");
    table.timestamp("buyTime");
    table.timestamp("sellTime");
    table.decimal("buyPrice", 24, 8);
    table.decimal("sellPrice", 24, 8);
    table.index(["symbol"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("backtest_results");
};
