/* =============================================================
   Dhiker — counter logic + theme + persistence
   ============================================================= */

const STORAGE_KEY = 'dhiker_v1';
const TARGET = 100;
const DOTS = 30;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const state = {
  count: 0,
  theme: 'light',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* ignore corrupt storage */ }
  // honor system pref on first visit (no saved value)
  if (!localStorage.getItem(STORAGE_KEY) && window.matchMedia) {
    state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const el = {
  counts:      document.querySelectorAll('.js-count'),
  targets:     document.querySelectorAll('.js-target'),
  remaining:   document.querySelector('.js-remaining'),
  pctBig:      document.querySelector('.js-pct-big'),
  pctLine:     document.querySelector('.js-pct-line'),
  togoLine:    document.querySelector('.js-togo-line'),
  fill:        document.querySelector('.js-fill'),
  dots:        document.querySelector('.js-dots'),
  session:     document.querySelector('.js-session'),
  incs:        document.querySelectorAll('.js-inc'),
  decs:        document.querySelectorAll('.js-dec'),
  resets:      document.querySelectorAll('.js-reset'),
  themeOpts:   document.querySelectorAll('[data-theme-set]'),
  themeIcon:   document.getElementById('themeIcon'),
  dateChip:    document.getElementById('dateChip'),
};

let dotEls = [];
function buildDots() {
  el.dots.innerHTML = '';
  dotEls = [];
  for (let i = 0; i < DOTS; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    el.dots.appendChild(d);
    dotEls.push(d);
  }
}

function render({ pop = false } = {}) {
  const n = state.count;
  const pct = Math.min(100, (n / TARGET) * 100);
  const remaining = Math.max(0, TARGET - n);
  const padded = String(n).padStart(3, '0');

  el.counts.forEach(c => {
    c.textContent = padded;
    if (pop) {
      c.classList.remove('pop');
      void c.offsetWidth; // restart animation
      c.classList.add('pop');
    }
  });
  el.targets.forEach(t => (t.textContent = TARGET));
  el.remaining.textContent = remaining;
  el.pctBig.textContent = `${pct.toFixed(0)}%`;
  el.pctLine.textContent = `${pct.toFixed(0)}% complete`;
  el.togoLine.textContent = `${remaining} to go`;
  el.fill.style.width = `${pct}%`;

  const filled = Math.min(DOTS, Math.round((n / TARGET) * DOTS));
  for (let i = 0; i < DOTS; i++) {
    dotEls[i].classList.toggle('is-filled', i < filled);
  }
}

function renderTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el.themeOpts.forEach(o => {
    o.classList.toggle('is-active', o.dataset.themeSet === state.theme);
  });
  if (el.themeIcon) el.themeIcon.textContent = state.theme === 'dark' ? '☾' : '☀';
}

function inc() {
  state.count += 1;
  render({ pop: true });
  if (navigator.vibrate) navigator.vibrate(8);
  save();
}

function dec() {
  if (state.count === 0) return;
  state.count -= 1;
  render({ pop: true });
  save();
}

function reset() {
  if (state.count === 0) return;
  if (!confirm('Reset the counter to 0?')) return;
  state.count = 0;
  render({ pop: true });
  save();
}

function setTheme(t) {
  state.theme = t;
  renderTheme();
  save();
}

function setDate() {
  const d = new Date();
  if (el.dateChip) el.dateChip.textContent =
    `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function startSession() {
  const start = Date.now();
  const tick = () => {
    const e = Math.floor((Date.now() - start) / 1000);
    const h = String(Math.floor(e / 3600)).padStart(2, '0');
    const m = String(Math.floor((e % 3600) / 60)).padStart(2, '0');
    const s = String(e % 60).padStart(2, '0');
    if (el.session) el.session.textContent = `session · ${h}:${m}:${s}`;
  };
  tick();
  setInterval(tick, 1000);
}

function bind() {
  el.incs.forEach(b => b.addEventListener('click', inc));
  el.decs.forEach(b => b.addEventListener('click', dec));
  el.resets.forEach(b => b.addEventListener('click', reset));

  el.themeOpts.forEach(o =>
    o.addEventListener('click', () => setTheme(o.dataset.themeSet)));

  if (el.themeIcon) {
    el.themeIcon.addEventListener('click',
      () => setTheme(state.theme === 'light' ? 'dark' : 'light'));
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const onButton = e.target.tagName === 'BUTTON';
    if (e.code === 'ArrowUp' || e.key === '+' || e.key === '=' ||
        (e.code === 'Space' && !onButton)) {
      e.preventDefault(); inc();
    } else if (e.code === 'ArrowDown' || e.key === '-' || e.key === '_') {
      e.preventDefault(); dec();
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
    }
  });
}

load();
buildDots();
renderTheme();
render();
setDate();
startSession();
bind();
