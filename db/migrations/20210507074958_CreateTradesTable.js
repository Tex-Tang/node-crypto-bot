exports.up = function (knex) {
  return knex.schema.createTable("trades", function (table) {
    table.increments();
    table.string("strategy");
    table.string("symbol");
    table.string("orderId");
    table.string("clientOrderId");
    table.decimal("amount", 16, 8);
    table.timestamp("openTime");
    table.decimal("openRate", 16, 8);
    table.timestamp("closeTime").nullable();
    table.decimal("closeRate", 16, 8).nullable();
    table.index(["symbol"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("trades");
};
