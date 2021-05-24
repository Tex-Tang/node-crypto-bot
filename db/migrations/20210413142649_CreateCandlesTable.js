exports.up = function (knex) {
  return knex.schema.createTable("candles", function (table) {
    table.increments();
    table.string("symbol");
    table.string("interval");
    table.timestamp("openTime");
    table.timestamp("closeTime");
    table.decimal("open", 24, 8);
    table.decimal("high", 24, 8);
    table.decimal("low", 24, 8);
    table.decimal("close", 24, 8);
    table.decimal("volume", 24, 8);
    table.index(["symbol", "interval"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("candles");
};
