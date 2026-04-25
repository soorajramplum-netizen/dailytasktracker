// middleware.js
// Vercel Edge Middleware — runs before every request.
// Intercepts HTML pages and injects environment variables
// so the browser never needs them hardcoded.

import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/', '/admin', '/person', '/history', '/pages/:path*.html'],
};

export default async function middleware(request) {
  const response = await fetch(request.url, {
    headers: request.headers,
  });

  const html = await response.text();

  const injected = html.replace(
    '</head>',
    `<script>
      window.ENV = {
        SUPABASE_URL:      "${process.env.SUPABASE_URL || ''}",
        SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY || ''}",
        GEMINI_API_KEY:    "${process.env.GEMINI_API_KEY || ''}",
      };
    </script>
  </head>`
  );

  return new NextResponse(injected, {
    status: response.status,
    headers: { 'content-type': 'text/html' },
  });
}
