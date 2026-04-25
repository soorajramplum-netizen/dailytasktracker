// ── utils.js ──
// Shared helpers used across all pages.

// ── Date helpers ─────────────────────────────────────────
export function today() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function isToday(dateStr) {
  return dateStr === today();
}

// ── Slot helpers ─────────────────────────────────────────
export const SLOT_ORDER = ['morning', 'afternoon', 'evening', 'specific'];

export const SLOT_META = {
  morning:   { label: 'Morning',   icon: '🌅', color: 'var(--morning)' },
  afternoon: { label: 'Afternoon', icon: '☀️',  color: 'var(--afternoon)' },
  evening:   { label: 'Evening',   icon: '🌙', color: 'var(--evening)' },
  specific:  { label: 'Specific Time', icon: '⏰', color: 'var(--specific)' },
};

export function groupBySlot(tasks) {
  const groups = {};
  for (const slot of SLOT_ORDER) {
    const items = tasks.filter(t => t.slot === slot);
    if (items.length) groups[slot] = items;
  }
  return groups;
}

// ── DOM helpers ───────────────────────────────────────────
export function el(id) { return document.getElementById(id); }

export function html(element, content) {
  if (element) element.innerHTML = content;
}

export function show(element) { if (element) element.style.display = ''; }
export function hide(element) { if (element) element.style.display = 'none'; }

// ── Toast ─────────────────────────────────────────────────
let toastContainer;

export function toast(message, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  toastContainer.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    t.style.transition = '0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── Clipboard ─────────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── URL params ────────────────────────────────────────────
export function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ── Loading state ─────────────────────────────────────────
export function setLoading(container, loading, message = 'Loading…') {
  if (loading) {
    container.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>${message}</span>
      </div>`;
  }
}

// ── Debounce ──────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
