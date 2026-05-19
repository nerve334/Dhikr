/* =============================================================
   Dhiker — three-dhikr tasbih sequence
   Subhanallah ×33 → Alhamdulillah ×33 → Allahu Akbar ×34
   Click / tap anywhere to count. Auto-advances on completion.
   ============================================================= */

const DHIKRS = [
  {
    arabic:  'سُبْحَانَ ٱللَّهِ',
    name:    'Subhanallah',
    meaning: 'Glory be to Allah',
    target:  33,
  },
  {
    arabic:  'ٱلْحَمْدُ لِلَّهِ',
    name:    'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    target:  33,
  },
  {
    arabic:  'ٱللَّهُ أَكْبَرُ',
    name:    'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target:  34,
  },
];

const STORAGE_KEY = 'dhiker_v4';

const state = {
  dhikrIndex:    0,
  count:         0,
  setsCompleted: 0,
  theme:         'dark',
  transitioning: false,
};

// ── Persistence ────────────────────────────────────────────
function save() {
  const { dhikrIndex, count, setsCompleted, theme } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dhikrIndex, count, setsCompleted, theme }));
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* ignore */ }
}

// ── DOM ────────────────────────────────────────────────────
const el = {
  themeBtn:    document.getElementById('themeBtn'),
  resetBtn:    document.getElementById('resetBtn'),
  sequence:    document.getElementById('sequence'),
  center:      document.getElementById('center'),
  arabic:      document.getElementById('arabic'),
  dhikrName:   document.getElementById('dhikrName'),
  dhikrMeaning:document.getElementById('dhikrMeaning'),
  count:       document.getElementById('count'),
  target:      document.getElementById('target'),
  beads:       document.getElementById('beads'),
  setsInfo:    document.getElementById('setsInfo'),
};

// ── Bead track ─────────────────────────────────────────────
let beadEls = [];
function buildBeads(target) {
  el.beads.innerHTML = '';
  beadEls = [];
  for (let i = 0; i < target; i++) {
    const b = document.createElement('span');
    b.className = 'bead';
    el.beads.appendChild(b);
    beadEls.push(b);
  }
}
function renderBeads() {
  beadEls.forEach((b, i) => b.classList.toggle('is-filled', i < state.count));
}

// ── Sequence chips ─────────────────────────────────────────
function renderSequence() {
  el.sequence.innerHTML = '';
  DHIKRS.forEach((d, i) => {
    const chip = document.createElement('span');
    chip.className = 'seq-chip';
    if      (i < state.dhikrIndex)  { chip.classList.add('is-done');   chip.textContent = `✓ ${d.name}`; }
    else if (i === state.dhikrIndex){ chip.classList.add('is-active');  chip.textContent = d.name; }
    else                            {                                   chip.textContent = d.name; }
    el.sequence.appendChild(chip);
  });
}

// ── Dhikr info ─────────────────────────────────────────────
function renderDhikr(animate = false) {
  const d = DHIKRS[state.dhikrIndex];
  el.arabic.textContent       = d.arabic;
  el.dhikrName.textContent    = d.name;
  el.dhikrMeaning.textContent = d.meaning;
  el.target.textContent       = d.target;
  if (animate) {
    el.center.classList.remove('entering');
    void el.center.offsetWidth;
    el.center.classList.add('entering');
  }
}

// ── Count display ──────────────────────────────────────────
function renderCount(pop = false, glow = false) {
  el.count.textContent = state.count;
  if (pop || glow) {
    el.count.classList.remove('pop', 'glow');
    void el.count.offsetWidth;
    el.count.classList.add(glow ? 'glow' : 'pop');
  }
}

// ── Sets info ──────────────────────────────────────────────
function renderSets(msg = '') {
  if (msg) {
    el.setsInfo.textContent = msg;
  } else if (state.setsCompleted > 0) {
    el.setsInfo.textContent =
      `${state.setsCompleted} set${state.setsCompleted > 1 ? 's' : ''} done`;
  } else {
    el.setsInfo.textContent = '';
  }
}

// ── Theme ──────────────────────────────────────────────────
function renderTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el.themeBtn.textContent = state.theme === 'dark' ? '☾' : '☀';
}

// ── Full render ────────────────────────────────────────────
function renderAll() {
  renderTheme();
  renderSequence();
  renderDhikr();
  renderCount();
  buildBeads(DHIKRS[state.dhikrIndex].target);
  renderBeads();
  renderSets();
}

// ── Advance to next dhikr ──────────────────────────────────
function advanceDhikr() {
  const nextIndex     = (state.dhikrIndex + 1) % DHIKRS.length;
  const isSetComplete = nextIndex === 0;
  if (isSetComplete) state.setsCompleted++;

  state.dhikrIndex    = nextIndex;
  state.count         = 0;
  state.transitioning = false;

  renderSequence();
  renderDhikr(true);
  renderCount();
  buildBeads(DHIKRS[state.dhikrIndex].target);
  renderBeads();

  if (isSetComplete) {
    renderSets(`MashaAllah — set ${state.setsCompleted} complete ✓`);
    setTimeout(() => renderSets(), 2800);
  } else {
    renderSets();
  }
  save();
}

// ── Count actions ──────────────────────────────────────────
function increment() {
  if (state.transitioning) return;
  state.count++;

  const done = state.count >= DHIKRS[state.dhikrIndex].target;
  renderCount(true, done);
  renderBeads();
  save();

  if (done) {
    state.transitioning = true;
    if (navigator.vibrate) navigator.vibrate([12, 50, 20]);
    setTimeout(advanceDhikr, 820);
  } else {
    if (navigator.vibrate) navigator.vibrate(8);
  }
}

function decrement() {
  if (state.transitioning || state.count === 0) return;
  state.count--;
  renderCount(true);
  renderBeads();
  save();
}

function reset() {
  if (!confirm('Reset the full sequence back to Subhanallah?')) return;
  state.transitioning = false;
  state.dhikrIndex    = 0;
  state.count         = 0;
  renderSequence();
  renderDhikr(true);
  renderCount();
  buildBeads(DHIKRS[0].target);
  renderBeads();
  renderSets();
  save();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  renderTheme();
  save();
}

// ── Bindings ───────────────────────────────────────────────
function bind() {
  // Tap anywhere that isn't a button = increment
  document.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    increment();
  });

  el.resetBtn.addEventListener('click', reset);
  el.themeBtn.addEventListener('click', toggleTheme);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const onBtn = e.target.tagName === 'BUTTON';
    if (e.code === 'ArrowUp' || e.key === '+' || e.key === '=' ||
        (e.code === 'Space' && !onBtn)) {
      e.preventDefault(); increment();
    } else if (e.code === 'ArrowDown' || e.key === '-' ||
               e.key === 'u' || e.key === 'U') {
      e.preventDefault(); decrement();
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
    }
  });

  // Prevent double-tap zoom on mobile
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch < 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
}

// ── Init ───────────────────────────────────────────────────
load();
renderAll();
bind();
