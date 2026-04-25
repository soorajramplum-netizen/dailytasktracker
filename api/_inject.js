// api/_inject.js
const fs   = require('fs');
const path = require('path');

function serveWithEnv(res, relativeHtmlPath) {
  const filePath = path.join(process.cwd(), relativeHtmlPath);

  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    res.status(404).send('Page not found: ' + relativeHtmlPath);
    return;
  }

  const envScript = `<script>
    window.ENV = {
      SUPABASE_URL:      ${JSON.stringify(process.env.SUPABASE_URL      || '')},
      SUPABASE_ANON_KEY: ${JSON.stringify(process.env.SUPABASE_ANON_KEY || '')},
      GEMINI_API_KEY:    ${JSON.stringify(process.env.GEMINI_API_KEY    || '')},
    };
  </script>`;

  html = html.replace('</head>', envScript + '\n</head>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}

module.exports = { serveWithEnv };
