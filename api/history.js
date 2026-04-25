// api/history.js
import { serveWithEnv } from './_inject.js';

export default function handler(req, res) {
  serveWithEnv(res, 'pages/history.html');
}
