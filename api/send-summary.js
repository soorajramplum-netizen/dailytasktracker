// api/send-summary.js
// Vercel Serverless Function
// Sends AI-generated daily summary email via Resend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, summary, date } = req.body;

  if (!to || !summary) {
    return res.status(400).json({ error: 'Missing required fields: to, summary' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: 'Georgia', serif; background: #F5F2EE; margin: 0; padding: 24px; color: #1A1714; }
    .wrap { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #C8561A; padding: 28px 32px; }
    .header h1 { color: #fff; font-size: 1.4rem; margin: 0; font-weight: normal; }
    .header p { color: rgba(255,255,255,0.8); font-size: 0.85rem; margin: 6px 0 0; }
    .body { padding: 32px; }
    .summary-text { font-size: 1rem; line-height: 1.8; color: #1A1714; }
    .footer { padding: 20px 32px; background: #F5F2EE; font-size: 0.78rem; color: #7A756E; border-top: 1px solid #DDD9D2; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🏠 Daily Household Summary</h1>
      <p>${date}</p>
    </div>
    <div class="body">
      <div class="summary-text">${summary.replace(/\n/g, '<br>')}</div>
    </div>
    <div class="footer">
      Sent from your Household Tracker · <a href="${process.env.VITE_APP_URL || '#'}" style="color:#C8561A">Open Dashboard</a>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Household Tracker <noreply@yourdomain.com>', // ← update with your verified Resend domain
        to:      [to],
        subject: `🏠 Daily Summary — ${date}`,
        html:    emailHTML,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: data.message || 'Email send failed' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Send summary error:', err);
    return res.status(500).json({ error: err.message });
  }
}
