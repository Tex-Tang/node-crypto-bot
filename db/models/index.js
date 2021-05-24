const Knex = require("knex");
const { Model } = require("objection");
const config = require("../../knexfile");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

const knex = Knex(config[argv.env || "development"]);

Model.knex(knex);

module.exports = Model;
