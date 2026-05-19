const DHIKRS = [
  { name: 'Subhanallah',   target: 33 },
  { name: 'Alhamdulillah', target: 33 },
  { name: 'Allahu Akbar',  target: 34 },
];

const STORAGE_KEY = 'dhiker_v3';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const state = {
  dhikrIndex:    0,
  count:         0,
  setsCompleted: 0,
  theme:         'dark',
  transitioning: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { dhikrIndex, count, setsCompleted, theme } = JSON.parse(raw);
      if (dhikrIndex    !== undefined) state.dhikrIndex    = dhikrIndex;
      if (count         !== undefined) state.count         = count;
      if (setsCompleted !== undefined) state.setsCompleted = setsCompleted;
      if (theme         !== undefined) state.theme         = theme;
    }
  } catch (e) { /* ignore corrupt storage */ }
}

function save() {
  const { dhikrIndex, count, setsCompleted, theme } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dhikrIndex, count, setsCompleted, theme }));
}

const el = {
  bignum:     document.querySelector('.js-count'),
  dhikrLabel: document.querySelector('.js-dhikr-name'),
  phaseChip:  document.querySelector('.js-phase-chip'),
  setsChip:   document.querySelector('.js-sets-chip'),
  phaseVal:   document.querySelector('.js-phase-val'),
  remaining:  document.querySelector('.js-remaining'),
  pctLine:    document.querySelector('.js-pct-line'),
  togoLine:   document.querySelector('.js-togo-line'),
  fill:       document.querySelector('.js-fill'),
  dots:       document.querySelector('.js-dots'),
  session:    document.querySelector('.js-session'),
  incs:       document.querySelectorAll('.js-inc'),
  decs:       document.querySelectorAll('.js-dec'),
  resets:     document.querySelectorAll('.js-reset'),
  themeOpts:  document.querySelectorAll('[data-theme-set]'),
  themeIcon:  document.getElementById('themeIcon'),
  dateChip:   document.getElementById('dateChip'),
};

let dotEls = [];
function buildDots(target) {
  el.dots.innerHTML = '';
  dotEls = [];
  for (let i = 0; i < target; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    el.dots.appendChild(d);
    dotEls.push(d);
  }
}

function render({ pop = false, celebrate = false, entering = false } = {}) {
  const d         = DHIKRS[state.dhikrIndex];
  const remaining = d.target - state.count;
  const pct       = (state.count / d.target) * 100;
  const phaseNum  = state.dhikrIndex + 1;
  const setsText  = state.setsCompleted === 0
    ? '0 sets'
    : `${state.setsCompleted} set${state.setsCompleted !== 1 ? 's' : ''}`;

  el.dhikrLabel.textContent = d.name;
  if (entering) {
    el.dhikrLabel.classList.remove('entering');
    void el.dhikrLabel.offsetWidth;
    el.dhikrLabel.classList.add('entering');
  }

  el.phaseChip.textContent = `Step ${phaseNum} of ${DHIKRS.length}`;
  el.setsChip.textContent  = setsText;

  el.bignum.textContent = String(state.count);
  if (pop || celebrate) {
    el.bignum.classList.remove('pop', 'celebrate');
    void el.bignum.offsetWidth;
    el.bignum.classList.add(celebrate ? 'celebrate' : 'pop');
  }

  if (el.phaseVal)  el.phaseVal.textContent  = `${phaseNum} / ${DHIKRS.length}`;
  if (el.remaining) el.remaining.textContent = remaining;

  el.pctLine.textContent  = `${state.count} of ${d.target}`;
  el.togoLine.textContent = `${remaining} to go`;
  el.fill.style.width     = `${pct}%`;

  dotEls.forEach((dot, i) => dot.classList.toggle('is-filled', i < state.count));
}

function renderTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el.themeOpts.forEach(o => {
    o.classList.toggle('is-active', o.dataset.themeSet === state.theme);
  });
  if (el.themeIcon) el.themeIcon.textContent = state.theme === 'dark' ? '☾' : '☀';
}

function advanceDhikr() {
  const nextIndex = (state.dhikrIndex + 1) % DHIKRS.length;
  if (nextIndex === 0) state.setsCompleted++;
  state.dhikrIndex    = nextIndex;
  state.count         = 0;
  state.transitioning = false;
  buildDots(DHIKRS[nextIndex].target);
  render({ pop: true, entering: true });
  save();
}

function inc() {
  if (state.transitioning) return;
  state.count++;
  const done = state.count >= DHIKRS[state.dhikrIndex].target;
  render({ pop: !done, celebrate: done });
  if (navigator.vibrate) navigator.vibrate(done ? [12, 50, 20] : 8);
  save();
  if (done) {
    state.transitioning = true;
    setTimeout(advanceDhikr, 820);
  }
}

function dec() {
  if (state.transitioning || state.count === 0) return;
  state.count--;
  render({ pop: true });
  save();
}

function reset() {
  state.dhikrIndex    = 0;
  state.count         = 0;
  state.setsCompleted = 0;
  state.transitioning = false;
  buildDots(DHIKRS[0].target);
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
  el.incs.forEach(b   => b.addEventListener('click', inc));
  el.decs.forEach(b   => b.addEventListener('click', dec));
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

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
}

load();
buildDots(DHIKRS[state.dhikrIndex].target);
renderTheme();
render();
setDate();
startSession();
bind();
