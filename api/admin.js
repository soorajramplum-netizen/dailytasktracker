// api/admin.js
const { serveWithEnv } = require('./_inject.js');

module.exports = function handler(req, res) {
  serveWithEnv(res, 'pages/admin.html');
};
