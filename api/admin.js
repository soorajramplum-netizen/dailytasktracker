const { serveWithEnv } = require('./_inject.js');
module.exports = function handler(req, res) {
  serveWithEnv(res, '_html/admin.html');
};
