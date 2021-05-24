const moment = require("moment");

module.exports = {
  formatTimeStamp: (ms) => {
    return moment(ms).utc().format("DD-MM-YYYY HH:mm:ss");
  },
};
