// ── person.js ──
import { getPerson, getDailyTasks, toggleTask, generateDailyFromTemplates } from './supabase.js';
import { today, formatDate, formatTime, groupBySlot, SLOT_META, SLOT_ORDER, getParam, toast, html, el, setLoading } from './utils.js';

const personId = getParam('person')?.toLowerCase();
let currentTasks = [];
let person = null;

async function init() {
  if (!personId) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:var(--font-body)">
        <div style="text-align:center;padding:40px">
          <div style="font-size:3rem;margin-bottom:16px">🏠</div>
          <h2 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:8px">No person specified</h2>
          <p style="color:var(--text-muted);font-size:0.9rem">Please use a link like <code>?person=dass</code></p>
        </div>
      </div>`;
    return;
  }

  person = await getPerson(personId).catch(() => null);
  if (!person) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:var(--font-body)">
        <div style="text-align:center;padding:40px">
          <div style="font-size:3rem;margin-bottom:16px">❓</div>
          <h2 style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:8px">Person not found</h2>
          <p style="color:var(--text-muted);font-size:0.9rem">Check your link and try again.</p>
        </div>
      </div>`;
    return;
  }

  // Set page meta
  document.title = `${person.name}'s Tasks`;
  el('person-name').textContent = person.name;
  el('person-emoji').textContent = person.emoji;
  el('person-avatar').style.background = person.color + '22';
  el('person-date').textContent = formatDate(today());

  // Generate daily tasks from templates (idempotent)
  await generateDailyFromTemplates(today()).catch(console.warn);

  await loadTasks();
}

async function loadTasks() {
  const container = el('tasks-container');
  setLoading(container, true, 'Fetching your tasks…');

  currentTasks = await getDailyTasks(today(), personId);
  renderTasks();
}

function renderTasks() {
  const container = el('tasks-container');
  const done = currentTasks.filter(t => t.is_done).length;
  const total = currentTasks.length;

  // Progress
  el('progress-done').textContent = done;
  el('progress-total').textContent = total;
  el('progress-label').textContent = done === total && total > 0
    ? 'All done! 🎉' : `${total - done} remaining`;
  const bar = el('progress-fill');
  const pct = total ? Math.round((done / total) * 100) : 0;
  bar.style.width = pct + '%';
  bar.classList.toggle('complete', done === total && total > 0);

  if (total === 0) {
    container.innerHTML = `
      <div class="no-tasks">
        <div class="no-tasks-icon">📋</div>
        <h3>No tasks for today</h3>
        <p>Check back later or ask the admin to add tasks.</p>
      </div>`;
    return;
  }

  if (done === total) {
    container.innerHTML = `
      <div class="all-done-banner">
        <div class="done-icon">🎉</div>
        <h3>All tasks complete!</h3>
        <p>Great work today, ${person.name}.</p>
      </div>`;
    return;
  }

  const groups = groupBySlot(currentTasks);
  let html_str = '';

  for (const slot of SLOT_ORDER) {
    const tasks = groups[slot];
    if (!tasks) continue;

    const meta = SLOT_META[slot];
    const slotDone = tasks.filter(t => t.is_done).length;

    html_str += `
      <div class="slot-group">
        <div class="slot-header">
          <span class="slot-dot ${slot}"></span>
          <span class="slot-title">${meta.icon} ${meta.label}</span>
          <span class="slot-count">${slotDone}/${tasks.length}</span>
        </div>
        ${tasks.map(taskHTML).join('')}
      </div>`;
  }

  container.innerHTML = html_str;

  // Attach checkbox listeners
  container.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('click', () => handleToggle(cb.dataset.id, cb.dataset.done === 'true'));
  });
}

function taskHTML(task) {
  return `
    <div class="task-item ${task.slot} ${task.is_done ? 'done' : ''}" id="task-${task.id}">
      <div class="task-checkbox ${task.is_done ? 'checked' : ''}"
           data-id="${task.id}"
           data-done="${task.is_done}"
           role="checkbox"
           aria-checked="${task.is_done}"
           tabindex="0">
      </div>
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${task.slot === 'specific' && task.specific_time
            ? `<span class="task-time">⏰ ${task.specific_time}</span>` : ''}
          ${task.is_done && task.done_at
            ? `<span class="task-done-time">✓ Done at ${formatTime(task.done_at)}</span>` : ''}
          ${task.is_recurring ? `<span class="task-recurring-badge">recurring</span>` : ''}
        </div>
      </div>
    </div>`;
}

async function handleToggle(taskId, wasDone) {
  const cb = document.querySelector(`.task-checkbox[data-id="${taskId}"]`);
  if (!cb) return;

  // Optimistic UI
  const nowDone = !wasDone;
  cb.classList.toggle('checked', nowDone);
  cb.classList.add('pop');
  cb.dataset.done = String(nowDone);
  setTimeout(() => cb.classList.remove('pop'), 300);

  // Update in Supabase
  try {
    await toggleTask(taskId, nowDone);
    // Update local state
    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
      task.is_done = nowDone;
      task.done_at = nowDone ? new Date().toISOString() : null;
    }
    toast(nowDone ? '✓ Task marked done!' : 'Task unmarked', nowDone ? 'success' : 'info');
    // Re-render after short delay to show animation
    setTimeout(renderTasks, 400);
  } catch (e) {
    // Revert
    cb.classList.toggle('checked', wasDone);
    cb.dataset.done = String(wasDone);
    toast('Failed to update task', 'error');
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Keyboard support for checkboxes
document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') {
    const cb = e.target.closest('.task-checkbox');
    if (cb) { e.preventDefault(); cb.click(); }
  }
});

init();
