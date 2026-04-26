// api/cron-email.js
// Called by Vercel Cron on schedule defined in vercel.json
// Env vars needed: RESEND_API_KEY, EMAIL_FROM, SUPABASE_URL, SUPABASE_ANON_KEY, CRON_EMAIL_TO

module.exports = async (req, res) => {
  // Vercel cron sends GET; protect with Vercel's built-in CRON_SECRET
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
  const TO_EMAIL      = process.env.CRON_EMAIL_TO; // comma-separated list

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: 'Supabase env vars not set' });
  }
  if (!TO_EMAIL) {
    return res.status(500).json({ error: 'CRON_EMAIL_TO not set' });
  }

  // Helper: Supabase REST query
  async function sbGet(path) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      }
    });
    if (!r.ok) return [];
    return await r.json();
  }

  // Date helpers (IST = UTC+5:30)
  function todayIST() {
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return ist.toISOString().split('T')[0];
  }
  function weekStartIST() {
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const day = ist.getUTCDay();
    const diff = (day + 6) % 7; // Monday = 0
    ist.setUTCDate(ist.getUTCDate() - diff);
    return ist.toISOString().split('T')[0];
  }

  const dateKey = todayIST();
  const ws      = weekStartIST();
  const dateStr = new Date(dateKey).toLocaleDateString('en-IN', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });

  const D_PEOPLE = ['k','d'];
  const W_PEOPLE = ['k','d','amma','appa','ajitha','selvi'];
  const PNAME    = { k:'Karthiga', d:'Dass', amma:'Amma', appa:'Appa', ajitha:'Ajitha', selvi:'Selvi' };

  const pendingDaily   = [];
  const pendingWeekly  = [];

  for (const p of D_PEOPLE) {
    const rows = await sbGet(`tasks?board=eq.daily&date_key=eq.${dateKey}_${p}&done=eq.false&order=created_at.asc`);
    rows.forEach(r => pendingDaily.push({ ...r, person: p, personName: PNAME[p] }));
  }
  for (const p of W_PEOPLE) {
    const rows = await sbGet(`tasks?board=eq.weekly&date_key=eq.${ws}_${p}&done=eq.false&order=created_at.asc`);
    rows.forEach(r => pendingWeekly.push({ ...r, person: p, personName: PNAME[p] }));
  }
  const groceryAll     = await sbGet(`grocery?date_key=eq.${dateKey}&order=created_at.asc`);
  const groceryPending = groceryAll.filter(i => !i.bought);

  const toList = TO_EMAIL.split(',').map(e => e.trim()).filter(Boolean);

  // Forward to send-email handler
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host     = req.headers['host'];
  const sendRes  = await fetch(`${protocol}://${host}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: toList, dateStr, pendingDaily, pendingWeekly, groceryPending })
  });

  const data = await sendRes.json();
  return res.status(sendRes.ok ? 200 : 500).json(data);
};
