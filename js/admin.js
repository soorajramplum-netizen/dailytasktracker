// ── admin.js ──
import {
  getPeople, getDailyTasks, getAllTasksForDate, createDailyTask,
  deleteDailyTask, toggleTask, getTemplates, createTemplate,
  deleteTemplate, generateDailyFromTemplates, saveSummaryLog
} from './supabase.js';
import { today, formatDate, formatDateShort, formatTime, addDays, isToday, groupBySlot, SLOT_META, SLOT_ORDER, toast, el, setLoading, copyToClipboard } from './utils.js';

let people = [];
let currentDate = today();
let activeTab = 'overview';
let selectedTemplatePersonId = null;

// ── Init ──────────────────────────────────────────────────
async function init() {
  people = await getPeople();
  renderPersonPills();
  setupTabs();
  setupDateNav();
  setupAddTaskForm();
  await loadTab('overview');
  el('admin-date-display').textContent = formatDate(currentDate);

  // Auto-generate recurring tasks for today
  await generateDailyFromTemplates(today()).catch(console.warn);
}

// ── Tabs ──────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      el(`tab-${tab}`).classList.add('active');
      activeTab = tab;
      loadTab(tab);
    });
  });
}

async function loadTab(tab) {
  if (tab === 'overview') await loadOverview();
  if (tab === 'tasks')    await loadTasks();
  if (tab === 'templates') await loadTemplates();
  if (tab === 'summary')  renderSummaryPanel();
}

// ── Date Nav ──────────────────────────────────────────────
function setupDateNav() {
  el('date-prev').addEventListener('click', () => changeDate(-1));
  el('date-next').addEventListener('click', () => changeDate(1));
  el('date-today').addEventListener('click', () => {
    currentDate = today();
    el('admin-date-display').textContent = formatDate(currentDate);
    loadTab(activeTab);
  });
}

function changeDate(n) {
  currentDate = addDays(currentDate, n);
  el('admin-date-display').textContent = formatDate(currentDate);
  loadTab(activeTab);
}

// ── Overview ──────────────────────────────────────────────
async function loadOverview() {
  const container = el('overview-grid');
  setLoading(container, true, 'Loading overview…');

  const tasks = await getAllTasksForDate(currentDate);
  const grid = people.map(p => {
    const pTasks = tasks.filter(t => t.person_id === p.id);
    const done = pTasks.filter(t => t.is_done).length;
    const total = pTasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const link = `${window.location.origin}/person?person=${p.id}`;
    return `
      <div class="person-card" style="--person-color: ${p.color}">
        <div class="person-card-header">
          <div class="person-card-avatar">${p.emoji}</div>
          <div>
            <div class="person-card-name">${p.name}</div>
            <div class="person-card-link">?person=${p.id}</div>
          </div>
        </div>
        <div class="person-card-stats">
          <div class="person-card-done">${done}<span>/${total} done</span></div>
          <button class="copy-link-btn" data-link="${link}">Copy Link</button>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${done === total && total > 0 ? 'complete' : ''}"
               style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = grid || '<p style="color:var(--text-muted)">No people found.</p>';

  container.querySelectorAll('.copy-link-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await copyToClipboard(btn.dataset.link);
      if (ok) toast('Link copied!', 'success');
    });
  });
}

// ── Tasks Tab ─────────────────────────────────────────────
async function loadTasks() {
  const container = el('tasks-list');
  setLoading(container, true);

  const tasks = await getAllTasksForDate(currentDate);

  if (!tasks.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No tasks for this date.</p></div>`;
    return;
  }

  container.innerHTML = tasks.map(t => {
    const p = people.find(p => p.id === t.person_id);
    return `
      <div class="admin-task-row ${t.is_done ? 'done' : ''}" id="atask-${t.id}">
        <div class="admin-task-person">
          <div class="admin-task-person-dot" style="background:${p?.color || '#ccc'}"></div>
          <span class="admin-task-person-name">${p?.name || t.person_id}</span>
        </div>
        <div class="slot-badge ${t.slot}">${SLOT_META[t.slot]?.icon} ${t.slot === 'specific' ? t.specific_time : SLOT_META[t.slot]?.label}</div>
        <div class="admin-task-title">${escapeHtml(t.title)}</div>
        <div class="admin-task-status ${t.is_done ? 'done-status' : 'pending-status'}">
          ${t.is_done ? `✓ ${formatTime(t.done_at)}` : 'Pending'}
        </div>
        <button class="admin-task-delete" data-id="${t.id}" title="Delete task">✕</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.admin-task-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this task?')) return;
      await deleteDailyTask(btn.dataset.id);
      toast('Task deleted', 'info');
      loadTasks();
    });
  });
}

// ── Add Task Form ─────────────────────────────────────────
function setupAddTaskForm() {
  // Populate person select
  const sel = el('add-task-person');
  sel.innerHTML = '<option value="">— Select person —</option>' +
    people.map(p => `<option value="${p.id}">${p.emoji} ${p.name}</option>`).join('');

  // Show/hide time field based on slot
  el('add-task-slot').addEventListener('change', e => {
    el('add-task-time-wrap').style.display = e.target.value === 'specific' ? '' : 'none';
  });

  el('add-task-btn').addEventListener('click', handleAddTask);
}

async function handleAddTask() {
  const personId  = el('add-task-person').value;
  const title     = el('add-task-title').value.trim();
  const slot      = el('add-task-slot').value;
  const time      = el('add-task-time').value;
  const recurring = el('add-task-recurring').checked;

  if (!personId || !title || !slot) {
    toast('Please fill in all required fields', 'error');
    return;
  }
  if (slot === 'specific' && !time) {
    toast('Please enter a specific time', 'error');
    return;
  }

  const btn = el('add-task-btn');
  btn.disabled = true;
  btn.textContent = 'Adding…';

  try {
    await createDailyTask({
      person_id:     personId,
      date:          currentDate,
      title,
      slot,
      specific_time: slot === 'specific' ? time : null,
      is_recurring:  recurring,
    });

    if (recurring) {
      await createTemplate({ person_id: personId, title, slot, specific_time: slot === 'specific' ? time : null });
    }

    // Reset
    el('add-task-title').value = '';
    el('add-task-person').value = '';
    el('add-task-slot').value = 'morning';
    el('add-task-recurring').checked = false;
    el('add-task-time-wrap').style.display = 'none';

    toast('Task added!', 'success');
    loadTab(activeTab);
  } catch (e) {
    toast('Failed to add task: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Task';
  }
}

// ── Templates ─────────────────────────────────────────────
function renderPersonPills() {
  const wrap = el('template-person-pills');
  if (!wrap) return;
  wrap.innerHTML = people.map(p => `
    <button class="person-pill ${selectedTemplatePersonId === p.id ? 'active' : ''}"
            data-id="${p.id}"
            style="--person-color:${p.color}">
      ${p.emoji} ${p.name}
    </button>`).join('');

  wrap.querySelectorAll('.person-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedTemplatePersonId = pill.dataset.id;
      renderPersonPills();
      loadTemplates();
    });
  });
}

async function loadTemplates() {
  const container = el('templates-list');
  if (!container) return;
  if (!selectedTemplatePersonId) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">👆</div><p>Select a person above to manage their recurring tasks.</p></div>`;
    return;
  }
  setLoading(container, true);
  const templates = await getTemplates(selectedTemplatePersonId);
  if (!templates.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>No recurring tasks yet for this person.</p></div>`;
    return;
  }
  container.innerHTML = templates.map(t => `
    <div class="admin-task-row" id="tmpl-${t.id}">
      <div class="slot-badge ${t.slot}">${SLOT_META[t.slot]?.icon} ${t.slot === 'specific' ? t.specific_time : SLOT_META[t.slot]?.label}</div>
      <div class="admin-task-title">${escapeHtml(t.title)}</div>
      <div class="admin-task-status pending-status">Recurring</div>
      <button class="admin-task-delete" data-id="${t.id}">✕</button>
    </div>`).join('');

  container.querySelectorAll('.admin-task-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this recurring task?')) return;
      await deleteTemplate(btn.dataset.id);
      toast('Recurring task deleted', 'info');
      loadTemplates();
    });
  });
}

// ── Summary / Gemini ──────────────────────────────────────
function renderSummaryPanel() {}

el('generate-summary-btn')?.addEventListener('click', async () => {
  const output  = el('summary-output');
  const btn     = el('generate-summary-btn');
  const emailTo = el('summary-email').value.trim();

  btn.disabled = true;
  output.innerHTML = `<div class="summary-loading"><span class="spinner"></span> Generating summary with Gemini…</div>`;

  try {
    const tasks = await getAllTasksForDate(today());
    const lines = people.map(p => {
      const pTasks = tasks.filter(t => t.person_id === p.id);
      const done   = pTasks.filter(t => t.is_done);
      const pending = pTasks.filter(t => !t.is_done);
      return `${p.name}: ${done.length}/${pTasks.length} done. ` +
        (done.length ? `Completed: ${done.map(t => t.title).join(', ')}. ` : '') +
        (pending.length ? `Pending: ${pending.map(t => t.title).join(', ')}.` : '');
    }).join('\n');

    const prompt = `You are a helpful household manager assistant. 
Here is today's task completion summary for ${formatDate(today())}:

${lines}

Please write a warm, concise daily summary (3-5 sentences) suitable to send as an email to the household owner. 
Highlight who did well, what's pending, and give a positive closing note.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${window.ENV.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await res.json();
    const summaryText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary generated.';

    output.textContent = summaryText;

    // Save log
    await saveSummaryLog(today(), summaryText, emailTo || null);

    // If email provided, trigger send via serverless function
    if (emailTo) {
      await fetch('/api/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo, summary: summaryText, date: formatDate(today()) }),
      });
      toast(`Summary sent to ${emailTo}`, 'success');
    } else {
      toast('Summary generated!', 'success');
    }
  } catch (e) {
    output.textContent = 'Error generating summary: ' + e.message;
    toast('Failed to generate summary', 'error');
  } finally {
    btn.disabled = false;
  }
});

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

init();
