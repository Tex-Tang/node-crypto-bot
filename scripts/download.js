const moment = require("moment");
const symbols = require("../exchange/symbols");
const DownloadService = require("../shared/download");

const sv = new DownloadService();
for (let interval of ["1m"]) {
  for (let symbol of symbols) {
    sv.download(symbol, interval, moment("20210401").utc().valueOf());
  }
}
