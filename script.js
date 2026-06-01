const DHIKRS = [
  { name: 'SubhanAllah',   target: 33 },
  { name: 'Alhamdulillah', target: 33 },
  { name: 'Allahu Akbar',  target: 34 },
];

const STORAGE_KEY = 'dhiker_v4';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const state = {
  dhikrIndex:    0,
  count:         0,
  setsCompleted: 0,
  mode:          'sequence', // 'sequence' | 'free'
  theme:         'dark',
  transitioning: false,
};

// One random Picsum image per dhikr + one for free mode, chosen fresh each session
const SESSION_IMGS = [...DHIKRS, {}].map(() =>
  `https://picsum.photos/seed/${Math.floor(Math.random() * 1000) + 1}/1600/900`
);

const bgEls    = [null, null];
let   activeBg = 0;
function setBg(index) {
  if (!bgEls[0]) return;
  const url  = SESSION_IMGS[index] || SESSION_IMGS[0];
  const next = 1 - activeBg;
  bgEls[next].style.backgroundImage = `url('${url}')`;
  bgEls[next].style.opacity = '1';
  bgEls[activeBg].style.opacity = '0';
  activeBg = next;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { dhikrIndex, count, setsCompleted, mode, theme } = JSON.parse(raw);
      if (dhikrIndex    !== undefined) state.dhikrIndex    = dhikrIndex;
      if (count         !== undefined) state.count         = count;
      if (setsCompleted !== undefined) state.setsCompleted = setsCompleted;
      if (mode          !== undefined) state.mode          = mode;
      if (theme         !== undefined) state.theme         = theme;
    }
  } catch (e) { /* ignore corrupt storage */ }
}

function save() {
  const { dhikrIndex, count, setsCompleted, mode, theme } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dhikrIndex, count, setsCompleted, mode, theme }));
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
  modes:      document.querySelectorAll('.js-mode'),
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
  const isFree = state.mode === 'free';

  // Mode button icon: shows what you'd switch TO
  el.modes.forEach(b => { b.textContent = isFree ? '≡' : '∞'; });

  if (isFree) {
    el.dhikrLabel.textContent = '∞';
    if (entering) {
      el.dhikrLabel.classList.remove('entering');
      void el.dhikrLabel.offsetWidth;
      el.dhikrLabel.classList.add('entering');
    }
    el.phaseChip.textContent = 'Free Mode';
    el.setsChip.textContent  = '';
    el.bignum.textContent    = String(state.count);
    if (pop) {
      el.bignum.classList.remove('pop', 'celebrate');
      void el.bignum.offsetWidth;
      el.bignum.classList.add('pop');
    }
    if (el.phaseVal)  el.phaseVal.textContent  = '∞';
    if (el.remaining) el.remaining.textContent = '—';
    el.pctLine.textContent  = String(state.count);
    el.togoLine.textContent = '∞';
    el.fill.style.width     = '0%';
    dotEls.forEach(dot => dot.classList.remove('is-filled'));
    return;
  }

  // ── Sequence mode ──────────────────────────────────────────
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
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  const nextIndex = (state.dhikrIndex + 1) % DHIKRS.length;
  if (nextIndex === 0) state.setsCompleted++;
  state.dhikrIndex    = nextIndex;
  state.count         = 0;
  state.transitioning = false;
  setBg(nextIndex);
  buildDots(DHIKRS[nextIndex].target);
  render({ pop: true, entering: true });
  save();
}

function inc() {
  if (state.transitioning) return;
  state.count++;

  if (state.mode === 'free') {
    render({ pop: true });
    save();
    return;
  }

  const done = state.count >= DHIKRS[state.dhikrIndex].target;
  render({ pop: !done, celebrate: done });
  save();
  if (done) {
    state.transitioning = true;
    setTimeout(advanceDhikr, 820);
  }
}

function toggleMode() {
  state.mode          = state.mode === 'sequence' ? 'free' : 'sequence';
  state.dhikrIndex    = 0;
  state.count         = 0;
  state.transitioning = false;
  if (state.mode === 'free') {
    buildDots(0);
    setBg(DHIKRS.length); // free-mode image slot
  } else {
    buildDots(DHIKRS[0].target);
    setBg(0);
  }
  render({ entering: true });
  save();
}

function reset() {
  state.dhikrIndex    = 0;
  state.count         = 0;
  state.setsCompleted = 0;
  state.transitioning = false;
  buildDots(state.mode === 'sequence' ? DHIKRS[0].target : 0);
  setBg(state.mode === 'sequence' ? 0 : DHIKRS.length);
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
  function fastBtn(nodes, fn) {
    nodes.forEach(b => {
      b.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(45);
        fn();
      }, { passive: false });
      b.addEventListener('click', fn);
    });
  }

  fastBtn(el.incs,   inc);
  fastBtn(el.modes,  toggleMode);
  fastBtn(el.resets, reset);

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
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMode();
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
    }
  });

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300 && !e.target.closest('button')) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
}

load();
bgEls[0] = document.getElementById('bgA');
bgEls[1] = document.getElementById('bgB');
setBg(state.mode === 'free' ? DHIKRS.length : state.dhikrIndex);
buildDots(state.mode === 'sequence' ? DHIKRS[state.dhikrIndex].target : 0);
renderTheme();
render();
setDate();
startSession();
bind();
