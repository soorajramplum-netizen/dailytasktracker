// api/send-email.js — Vercel serverless function
// Env vars needed: RESEND_API_KEY, EMAIL_FROM (e.g. "Task Tracker <noreply@yourdomain.com>")

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'Task Tracker <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured in Vercel env vars.' });
  }

  const { to, dateStr, sections, groceryRemaining, totalTasks, doneTasks } = req.body;

  if (!to) return res.status(400).json({ error: 'No recipient email provided.' });

  // Build HTML email
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const barColor = pct === 100 ? '#3ab87c' : pct >= 60 ? '#e8a020' : '#c8763a';

  const PERSON_COLORS = {
    Karthiga: '#c8763a', Dass: '#3a7cc8', Amma: '#7c3ac8',
    Appa: '#3ab87c', Ajitha: '#e05a8a', Selvi: '#e8a020'
  };

  const priorityBadge = (p) => {
    if (!p) return '';
    const map = { high: '#c0392b', medium: '#b07020', low: '#2060a0' };
    const emoji = { high: '🔴', medium: '🟡', low: '🔵' };
    return `<span style="display:inline-block;background:${map[p]}22;color:${map[p]};border:1px solid ${map[p]}44;padding:1px 7px;border-radius:8px;font-size:10px;font-weight:700;margin-left:4px;">${emoji[p]} ${p}</span>`;
  };

  const taskRow = (t) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe0;font-size:13px;color:${t.done ? '#7aaa7a' : '#2a1f0e'};${t.done ? 'text-decoration:line-through;' : ''}">
        ${t.done ? '✅' : '⬜'} ${t.text}
        ${t.assignedBy ? `<span style="font-size:10px;color:#9a8a72;margin-left:6px;">by ${t.assignedBy}</span>` : ''}
        ${priorityBadge(t.priority)}
        ${t.dueDate ? `<span style="font-size:10px;color:#9a8a72;margin-left:6px;">📅 ${new Date(t.dueDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>` : ''}
      </td>
    </tr>
    ${t.note ? `<tr><td style="padding:0 12px 6px 32px;font-size:11px;color:#9a8a72;font-style:italic;border-bottom:1px solid #f0ebe0;">${t.note}</td></tr>` : ''}
  `;

  // Split sections by type
  const dailySections = sections.filter(s => s.type === 'daily');
  const weeklySections = sections.filter(s => s.type === 'weekly');

  const renderSections = (secs) => secs.map(s => {
    const color = PERSON_COLORS[s.person] || '#9a8a72';
    const sPct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e8dece;border-radius:12px;overflow:hidden;background:#fff;">
        <tr>
          <td style="padding:12px 16px;background:linear-gradient(135deg,#fdfaf6,#fff);border-bottom:1px solid #e8dece;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:${color};align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;margin-right:8px;vertical-align:middle;">${s.person.substring(0,2).toUpperCase()}</span>
                  <strong style="font-size:14px;color:#2a1f0e;vertical-align:middle;">${s.person}</strong>
                </td>
                <td align="right" style="font-size:11px;color:#9a8a72;">${s.done}/${s.total} done &nbsp;<strong style="color:${color}">${sPct}%</strong></td>
              </tr>
            </table>
            <div style="margin-top:6px;height:4px;background:#f5f0e8;border-radius:2px;"><div style="width:${sPct}%;height:4px;background:${color};border-radius:2px;"></div></div>
          </td>
        </tr>
        ${s.tasks.map(taskRow).join('')}
      </table>
    `;
  }).join('');

  const groceryHtml = groceryRemaining.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e8dece;border-radius:12px;overflow:hidden;background:#fff;">
        <tr><td style="padding:12px 16px;background:linear-gradient(135deg,#fff8ee,#fff);border-bottom:1px solid #e8dece;">
          <strong style="font-size:14px;color:#2a1f0e;">🛒 Grocery — Still Needed (${groceryRemaining.length} items)</strong>
        </td></tr>
        ${groceryRemaining.map(i => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0ebe0;font-size:13px;color:#2a1f0e;">⬜ ${i.name}${i.qty ? ` <span style="color:#c8763a;font-weight:600;">✕${i.qty}</span>` : ''} ${i.category ? `<span style="font-size:10px;color:#9a8a72;">(${i.category})</span>` : ''}</td></tr>`).join('')}
      </table>`
    : `<p style="font-size:13px;color:#3ab87c;font-weight:600;text-align:center;">🛒 All grocery items have been bought!</p>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fdf8f0;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2a1f0e,#4a3a28);border-radius:16px 16px 0 0;padding:28px 28px 20px;text-align:center;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8763a;margin-bottom:6px;">Daily Summary</div>
          <div style="font-family:Georgia,serif;font-size:24px;font-weight:900;color:#fdf8f0;">Task Tracker</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;">${dateStr}</div>
        </td></tr>

        <!-- Overall progress -->
        <tr><td style="background:#fff;padding:20px 28px;border-left:1px solid #e8dece;border-right:1px solid #e8dece;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9a8a72;">Today's Overall Progress</td>
              <td align="right" style="font-size:20px;font-weight:900;color:${barColor};">${pct}%</td>
            </tr>
          </table>
          <div style="margin-top:8px;height:8px;background:#f5f0e8;border-radius:4px;"><div style="width:${pct}%;height:8px;background:${barColor};border-radius:4px;transition:width .3s;"></div></div>
          <p style="font-size:12px;color:#9a8a72;margin:8px 0 0;">${doneTasks} of ${totalTasks} tasks completed today</p>
        </td></tr>

        <!-- Daily tasks -->
        <tr><td style="background:#fff;padding:0 28px 8px;border-left:1px solid #e8dece;border-right:1px solid #e8dece;">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9a8a72;padding:12px 0 10px;border-bottom:2px solid #f0ebe0;margin-bottom:14px;">📅 Today's Tasks</div>
          ${renderSections(dailySections)}
        </td></tr>

        <!-- Weekly tasks -->
        ${weeklySections.length > 0 ? `
        <tr><td style="background:#fff;padding:0 28px 8px;border-left:1px solid #e8dece;border-right:1px solid #e8dece;">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9a8a72;padding:12px 0 10px;border-bottom:2px solid #f0ebe0;margin-bottom:14px;">📋 This Week's Tasks</div>
          ${renderSections(weeklySections)}
        </td></tr>` : ''}

        <!-- Grocery -->
        <tr><td style="background:#fff;padding:0 28px 20px;border-left:1px solid #e8dece;border-right:1px solid #e8dece;">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9a8a72;padding:12px 0 10px;border-bottom:2px solid #f0ebe0;margin-bottom:14px;">🛒 Grocery</div>
          ${groceryHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f0e8;border:1px solid #e8dece;border-top:none;border-radius:0 0 16px 16px;padding:16px 28px;text-align:center;">
          <p style="font-size:11px;color:#9a8a72;margin:0;">Sent by Task Tracker · Auto-summary at 9 PM daily</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Send via Resend
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: `📋 Task Summary — ${dateStr} (${pct}% done)`,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Resend API error', detail: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
