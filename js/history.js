// ── history.js ──
import { getPeople, getHistory, getAllTasksForDate } from './supabase.js';
import { today, addDays, formatDate, formatDateShort, formatTime, toast, el, setLoading } from './utils.js';

let people = [];
let selectedPersonId = '';
let daysBack = 7;

async function init() {
  people = await getPeople();
  setupFilters();
  await loadHistory();
}

function setupFilters() {
  const personSel = el('filter-person');
  personSel.innerHTML = '<option value="">All people</option>' +
    people.map(p => `<option value="${p.id}">${p.emoji} ${p.name}</option>`).join('');

  personSel.addEventListener('change', e => {
    selectedPersonId = e.target.value;
    loadHistory();
  });

  el('filter-days').addEventListener('change', e => {
    daysBack = parseInt(e.target.value);
    loadHistory();
  });
}

async function loadHistory() {
  const container = el('history-container');
  setLoading(container, true, 'Loading history…');

  const toDate   = today();
  const fromDate = addDays(toDate, -daysBack + 1);

  const tasks = await getHistory(fromDate, toDate, selectedPersonId || undefined);

  // ── Stats ──────────────────────────────────────
  const totalDone = tasks.length;
  const uniqueDays = new Set(tasks.map(t => t.date)).size;
  const topPerson = (() => {
    const counts = {};
    tasks.forEach(t => counts[t.person_id] = (counts[t.person_id] || 0) + 1);
    const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    if (!top) return '—';
    const p = people.find(p => p.id === top[0]);
    return p ? `${p.emoji} ${p.name}` : top[0];
  })();

  // ── Per-person breakdown ───────────────────────
  const allTasks = await Promise.all(
    Array.from({ length: daysBack }, (_, i) => getAllTasksForDate(addDays(toDate, -i)))
  ).then(results => results.flat());

  const breakdownHTML = people.map(p => {
    const pAll  = allTasks.filter(t => t.person_id === p.id);
    const pDone = pAll.filter(t => t.is_done).length;
    const pct   = pAll.length ? Math.round((pDone / pAll.length) * 100) : 0;
    return `
      <div class="breakdown-row">
        <div class="breakdown-avatar">${p.emoji}</div>
        <div class="breakdown-name">${p.name}</div>
        <div class="breakdown-bar-wrap">
          <div class="progress-bar" style="flex:1">
            <div class="progress-bar-fill ${pct === 100 ? 'complete' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="breakdown-pct">${pct}%</div>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted)">${pDone}/${pAll.length}</div>
      </div>`;
  }).join('');

  // ── Log grouped by date ────────────────────────
  const byDate = {};
  tasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });

  const logHTML = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => {
      const isTdy = date === today();
      return `
        <div class="history-day-group">
          <div class="history-day-header">
            ${formatDateShort(date)}
            ${isTdy ? '<span class="history-day-badge">Today</span>' : ''}
            <span class="history-day-badge">${items.length} tasks</span>
          </div>
          ${items.map(t => {
            const p = people.find(p => p.id === t.person_id);
            return `
              <div class="history-item">
                <div class="history-item-dot" style="background:${p?.color || '#ccc'}"></div>
                <div class="history-item-person">${p?.name || t.person_id}</div>
                <div class="history-item-task">${escapeHtml(t.title)}</div>
                <div class="history-item-time">${t.done_at ? formatTime(t.done_at) : ''}</div>
                <div class="history-item-check">✓</div>
              </div>`;
          }).join('')}
        </div>`;
    }).join('') || `<div class="empty-state"><div class="empty-icon">📭</div><p>No completed tasks in this period.</p></div>`;

  container.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Tasks Completed</div>
        <div class="stat-value">${totalDone}</div>
        <div class="stat-sub">last ${daysBack} days</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Days</div>
        <div class="stat-value">${uniqueDays}</div>
        <div class="stat-sub">of ${daysBack}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Top Performer</div>
        <div class="stat-value" style="font-size:1.2rem;margin-top:4px">${topPerson}</div>
      </div>
    </div>

    <div class="history-section-title">Completion by Person</div>
    <div class="person-breakdown">${breakdownHTML}</div>

    <div class="history-section-title">Activity Log</div>
    ${logHTML}
  `;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

init();
