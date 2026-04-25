const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  // Inject environment variables into the page as a window global
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const adminPw   = process.env.ADMIN_PASSWORD  || 'family2025';

  const injected = html.replace(
    '</head>',
    `<script>
      window.__GEMINI_API_KEY__ = ${JSON.stringify(geminiKey)};
      // Override the ADMIN_PASSWORD constant read at runtime
      // We patch it after the script tag that defines it
    </script>
    </head>`
  ).replace(
    "? process.env.ADMIN_PASSWORD\n  : 'family2025';",
    `? ${JSON.stringify(adminPw)}\n  : ${JSON.stringify(adminPw)};`
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(injected);
};
