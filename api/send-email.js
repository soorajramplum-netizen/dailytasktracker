// api/send-email.js
// Env vars: RESEND_API_KEY, EMAIL_FROM

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.EMAIL_FROM || 'Task Tracker <onboarding@resend.dev>';
  if (!KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set in Vercel env vars.' });

  const { to, dateStr, pendingDaily, pendingWeekly, groceryPending } = req.body;
  if (!to || !to.length) return res.status(400).json({ error: 'No recipient(s) provided.' });

  const PCOL = { Karthiga:'#c8763a', Dass:'#3a7cc8', Amma:'#7c3ac8', Appa:'#3ab87c', Ajitha:'#e05a8a', Selvi:'#e8a020' };
  const priIcon = { high:'🔴', medium:'🟡', low:'🔵' };

  function dueBit(due) {
    if (!due) return '';
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(due + 'T00:00:00');
    const fmt = d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
    if (d < today) return ` <span style="color:#c0392b;font-weight:700">⚠️ ${fmt}</span>`;
    if (d.getTime() === today.getTime()) return ` <span style="color:#1a7a40;font-weight:700">🟢 Today</span>`;
    return ` <span style="color:#9a8a72">📅 ${fmt}</span>`;
  }

  function taskBullet(t) {
    const col = PCOL[t.personName] || '#9a8a72';
    const pri = t.priority ? `<span style="background:${t.priority==='high'?'#fff0ee':t.priority==='medium'?'#fff6e0':'#f0f8ff'};color:${t.priority==='high'?'#c0392b':t.priority==='medium'?'#b07020':'#2060a0'};padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;margin-left:4px">${priIcon[t.priority]||''} ${t.priority}</span>` : '';
    return `
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #f5f0e8;vertical-align:top">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span style="flex-shrink:0;margin-top:2px;font-size:14px">●</span>
            <div>
              <span style="font-size:13px;font-weight:600;color:#2a1f0e">${t.text}</span>
              ${pri}${dueBit(t.due_date)}
              ${t.note ? `<div style="font-size:11px;color:#9a8a72;font-style:italic;margin-top:2px">${t.note}</div>` : ''}
              ${t.assigned_by ? `<span style="font-size:10px;color:#b0a090">Assigned by ${t.assigned_by}</span>` : ''}
            </div>
          </div>
        </td>
      </tr>`;
  }

  // Group by person
  function groupByPerson(tasks) {
    const g = {};
    tasks.forEach(t => {
      const n = t.personName || t.person;
      if (!g[n]) g[n] = [];
      g[n].push(t);
    });
    return g;
  }

  function personBlock(name, tasks, accent) {
    const col = PCOL[name] || '#9a8a72';
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border-radius:12px;overflow:hidden;border:1px solid #e8dece;">
        <tr>
          <td style="padding:10px 16px;background:linear-gradient(135deg,#fdfaf6,#fff);border-bottom:1px solid #e8dece">
            <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${col};color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:24px;margin-right:8px;vertical-align:middle">${name.substring(0,2).toUpperCase()}</span>
            <strong style="font-size:13px;color:#2a1f0e;vertical-align:middle">${name}</strong>
            <span style="float:right;font-size:11px;color:#9a8a72;line-height:24px">${tasks.length} pending</span>
          </td>
        </tr>
        <tr><td style="padding:4px 16px 8px;background:#fff">
          <table width="100%" cellpadding="0" cellspacing="0">${tasks.map(taskBullet).join('')}</table>
        </td></tr>
      </table>`;
  }

  const totalPending = pendingDaily.length + pendingWeekly.length;
  const allGood = totalPending === 0 && groceryPending.length === 0;

  const dailyGroups = groupByPerson(pendingDaily);
  const weeklyGroups = groupByPerson(pendingWeekly);

  const dailyHtml = Object.keys(dailyGroups).length
    ? Object.entries(dailyGroups).map(([n,t]) => personBlock(n,t,PCOL[n])).join('')
    : `<p style="color:#3ab87c;font-size:13px;font-weight:600;text-align:center;padding:12px">🎉 All daily tasks done!</p>`;

  const weeklyHtml = Object.keys(weeklyGroups).length
    ? Object.entries(weeklyGroups).map(([n,t]) => personBlock(n,t,PCOL[n])).join('')
    : `<p style="color:#3ab87c;font-size:13px;font-weight:600;text-align:center;padding:12px">🎉 All weekly tasks done!</p>`;

  const groceryHtml = groceryPending.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8dece;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:10px 16px;background:linear-gradient(135deg,#fff8ee,#fff);border-bottom:1px solid #e8dece">
          <strong style="font-size:13px;color:#2a1f0e">🛒 Grocery — ${groceryPending.length} item${groceryPending.length>1?'s':''} still needed</strong>
        </td></tr>
        <tr><td style="padding:8px 16px;background:#fff">
          ${groceryPending.map(i=>`<div style="padding:5px 0;border-bottom:1px solid #f5f0e8;font-size:13px">● ${i.name}${i.qty?` <strong style="color:#c8763a">✕${i.qty}</strong>`:''} <span style="color:#9a8a72;font-size:11px">${i.category||''}</span></div>`).join('')}
        </td></tr>
      </table>`
    : `<p style="color:#3ab87c;font-size:13px;font-weight:600;text-align:center;padding:12px">🛒 Grocery list is all done!</p>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fdf8f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f0;padding:28px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1e1408,#3a2a18);border-radius:16px 16px 0 0;padding:24px 28px;text-align:center">
    <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#c8763a;margin-bottom:6px">Daily Snapshot</div>
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#fdf8f0">Task Tracker</div>
    <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">${dateStr}</div>
  </td></tr>

  ${allGood ? `
  <!-- All done banner -->
  <tr><td style="background:#fff;padding:28px;border:1px solid #e8dece;border-top:none;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">🎉</div>
    <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#2a1f0e;margin-bottom:4px">Everything is done!</div>
    <div style="font-size:13px;color:#9a8a72">No pending tasks or grocery items. Great job!</div>
  </td></tr>
  ` : `
  <!-- Summary pill -->
  <tr><td style="background:#fff;padding:16px 28px 8px;border-left:1px solid #e8dece;border-right:1px solid #e8dece">
    <div style="background:#fff8ee;border:1px solid #e8d090;border-radius:10px;padding:10px 16px;display:inline-block;width:100%;box-sizing:border-box">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b07020">Pending Today</span>
      <span style="float:right;font-size:18px;font-weight:900;color:#c8763a">${totalPending} task${totalPending!==1?'s':''}</span>
    </div>
  </td></tr>

  <!-- Daily pending -->
  <tr><td style="background:#fff;padding:12px 28px 6px;border-left:1px solid #e8dece;border-right:1px solid #e8dece">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9a8a72;padding-bottom:8px;border-bottom:2px solid #f0ebe0;margin-bottom:12px">📅 Today's Pending</div>
    ${dailyHtml}
  </td></tr>

  <!-- Weekly pending -->
  <tr><td style="background:#fff;padding:6px 28px 12px;border-left:1px solid #e8dece;border-right:1px solid #e8dece">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9a8a72;padding-bottom:8px;border-bottom:2px solid #f0ebe0;margin-bottom:12px">📋 This Week's Pending</div>
    ${weeklyHtml}
  </td></tr>

  <!-- Grocery -->
  <tr><td style="background:#fff;padding:6px 28px 20px;border-left:1px solid #e8dece;border-right:1px solid #e8dece">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9a8a72;padding-bottom:8px;border-bottom:2px solid #f0ebe0;margin-bottom:12px">🛒 Grocery Still Needed</div>
    ${groceryHtml}
  </td></tr>
  `}

  <!-- Footer -->
  <tr><td style="background:#f5f0e8;border:1px solid #e8dece;border-top:none;border-radius:0 0 16px 16px;padding:14px 28px;text-align:center">
    <p style="font-size:11px;color:#9a8a72;margin:0">Task Tracker · Pending-only snapshot · Powered by Supabase + Resend</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const subject = allGood
    ? `✅ All done! — Task Tracker ${dateStr}`
    : `📋 ${totalPending} pending task${totalPending!==1?'s':''} — ${dateStr}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: d.message || 'Resend error', detail: d });
    return res.status(200).json({ success: true, id: d.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
