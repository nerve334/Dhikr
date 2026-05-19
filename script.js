/* =============================================================
   Dhiker — counter logic + theme + persistence
   - Goal is editable; on each cycle it loops automatically
   - Total count never resets at the goal; it keeps climbing
   - Dark theme is the default for new visitors
   ============================================================= */

const STORAGE_KEY = 'dhiker_v2';
const DOTS = 30;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const state = {
  count: 0,
  goal: 100,
  theme: 'dark',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* ignore corrupt storage */ }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const el = {
  counts:      document.querySelectorAll('.js-count'),
  targets:     document.querySelectorAll('.js-target'),
  rounds:      document.querySelectorAll('.js-round'),
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
  goalEdits:   document.querySelectorAll('.js-goal-edit'),
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

// Cycle math — total count keeps growing, progress wraps each goal.
function cycleStats() {
  const g = Math.max(1, state.goal);
  const n = state.count;
  const cycleN     = n === 0 ? 0 : ((n - 1) % g) + 1;          // 0..g
  const round      = n === 0 ? 1 : Math.ceil(n / g);           // 1, 2, 3...
  const remaining  = Math.max(0, g - cycleN);
  const pct        = (cycleN / g) * 100;
  return { cycleN, round, remaining, pct, goal: g };
}

function render({ pop = false, celebrate = false } = {}) {
  const { cycleN, round, remaining, pct, goal } = cycleStats();

  el.counts.forEach(c => {
    c.textContent = String(state.count);
    if (pop) {
      c.classList.remove('pop');
      void c.offsetWidth;
      c.classList.add('pop');
    }
    if (celebrate) {
      c.classList.remove('celebrate');
      void c.offsetWidth;
      c.classList.add('celebrate');
    }
  });
  el.targets.forEach(t => (t.textContent = goal));
  el.rounds.forEach(r => (r.textContent = round));
  el.remaining.textContent = remaining;
  el.pctBig.textContent = `${Math.round(pct)}%`;
  el.pctLine.textContent = `${Math.round(pct)}% complete`;
  el.togoLine.textContent = `${remaining} to go`;
  el.fill.style.width = `${pct}%`;

  const filled = Math.min(DOTS, Math.round((cycleN / goal) * DOTS));
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
  const justCompletedRound = state.count > 0 && state.count % state.goal === 0;
  render({ pop: true, celebrate: justCompletedRound });
  if (navigator.vibrate) navigator.vibrate(justCompletedRound ? [12, 40, 12] : 8);
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

function editGoal() {
  const input = window.prompt('Set your goal (1–9999):', String(state.goal));
  if (input === null) return; // cancelled
  const n = parseInt(input.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 9999) {
    alert('Please enter a whole number between 1 and 9999.');
    return;
  }
  state.goal = n;
  render({ pop: true });
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
  el.goalEdits.forEach(g => g.addEventListener('click', editGoal));

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
    } else if (e.key === 'g' || e.key === 'G') {
      editGoal();
    }
  });

  // Belt-and-suspenders zoom prevention on iOS — block pinch and double-tap zoom.
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
}

load();
buildDots();
renderTheme();
render();
setDate();
startSession();
bind();
