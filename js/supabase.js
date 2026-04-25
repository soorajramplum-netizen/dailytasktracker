// ── supabase.js ──
// All Supabase interactions live here.
// Reads SUPABASE_URL and SUPABASE_ANON_KEY from window.ENV (injected at runtime).

const SUPABASE_URL     = window.ENV?.SUPABASE_URL     || '';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

async function sbFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        options.prefer || 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Supabase error ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── People ──────────────────────────────────────────────
export async function getPeople() {
  return sbFetch('people?order=name.asc');
}

export async function getPerson(id) {
  const rows = await sbFetch(`people?id=eq.${id}`);
  return rows?.[0] || null;
}

// ── Task Templates ───────────────────────────────────────
export async function getTemplates(personId) {
  const filter = personId ? `person_id=eq.${personId}&` : '';
  return sbFetch(`task_templates?${filter}is_active=eq.true&order=sort_order.asc`);
}

export async function createTemplate(data) {
  return sbFetch('task_templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(id, data) {
  return sbFetch(`task_templates?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id) {
  return sbFetch(`task_templates?id=eq.${id}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

// ── Daily Tasks ──────────────────────────────────────────
export async function getDailyTasks(date, personId) {
  let filter = `date=eq.${date}`;
  if (personId) filter += `&person_id=eq.${personId}`;
  return sbFetch(`daily_tasks?${filter}&order=slot.asc,specific_time.asc,created_at.asc`);
}

export async function createDailyTask(data) {
  return sbFetch('daily_tasks', {
    method: 'POST',
    body: JSON.stringify({ ...data }),
  });
}

export async function toggleTask(id, isDone) {
  return sbFetch(`daily_tasks?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
    }),
  });
}

export async function deleteDailyTask(id) {
  return sbFetch(`daily_tasks?id=eq.${id}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

// ── Generate daily tasks from templates ──────────────────
// Call once per day (admin triggers this or cron does via API route)
export async function generateDailyFromTemplates(date) {
  const people    = await getPeople();
  const templates = await getTemplates();

  // Check which template IDs are already in today's daily_tasks
  const existing = await getDailyTasks(date);
  const existingTemplateIds = new Set(
    existing.filter(t => t.template_id).map(t => t.template_id)
  );

  const toInsert = templates
    .filter(t => !existingTemplateIds.has(t.id))
    .map(t => ({
      person_id:     t.person_id,
      date,
      title:         t.title,
      slot:          t.slot,
      specific_time: t.specific_time,
      is_recurring:  true,
      template_id:   t.id,
    }));

  if (toInsert.length === 0) return [];

  return sbFetch('daily_tasks', {
    method: 'POST',
    body: JSON.stringify(toInsert),
  });
}

// ── History ──────────────────────────────────────────────
export async function getHistory(fromDate, toDate, personId) {
  let filter = `date=gte.${fromDate}&date=lte.${toDate}&is_done=eq.true`;
  if (personId) filter += `&person_id=eq.${personId}`;
  return sbFetch(`daily_tasks?${filter}&order=done_at.desc`);
}

export async function getAllTasksForDate(date) {
  return sbFetch(`daily_tasks?date=eq.${date}&order=person_id.asc,slot.asc`);
}

// ── Summary Logs ─────────────────────────────────────────
export async function saveSummaryLog(date, summaryText, emailSentTo) {
  return sbFetch('summary_logs', {
    method: 'POST',
    body: JSON.stringify({ date, summary_text: summaryText, email_sent_to: emailSentTo }),
  });
}

export async function getSummaryLogs(limit = 10) {
  return sbFetch(`summary_logs?order=sent_at.desc&limit=${limit}`);
}
