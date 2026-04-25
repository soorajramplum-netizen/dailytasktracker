// api/index.js
import { serveWithEnv } from './_inject.js';

export default function handler(req, res) {
  serveWithEnv(res, 'index.html');
}
