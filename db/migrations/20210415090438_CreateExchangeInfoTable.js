exports.up = function (knex) {
  return knex.schema.createTable("exchange_info", function (table) {
    table.increments();
    table.string("symbol");
    table.string("baseAsset");
    table.string("quoteAsset");
    table.string("minNotional");
    table.decimal("tickSize", 16, 8);
    table.index(["symbol"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("exchange_info");
};
