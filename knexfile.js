module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./prod.sqlite3",
    },
    migrations: {
      directory: "./db/migrations",
      tableName: "migrations",
    },
    useNullAsDefault: true,
  },
};
