// inject-env.js
// Serves index.html with environment variables injected securely server-side.
// The placeholder comment /* __ENV_INJECT__ */ in index.html is replaced at runtime.

const fs   = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  const injected = html.replace(
    '/* __ENV_INJECT__ */',
    `window.__SUPABASE_URL__    = ${JSON.stringify(process.env.SUPABASE_URL    || '')};
     window.__SUPABASE_ANON__   = ${JSON.stringify(process.env.SUPABASE_ANON_KEY || '')};
     window.__ADMIN_PASSWORD__  = ${JSON.stringify(process.env.ADMIN_PASSWORD  || 'family2025')};
     window.__GEMINI_API_KEY__  = ${JSON.stringify(process.env.GEMINI_API_KEY  || '')};`
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(injected);
};
