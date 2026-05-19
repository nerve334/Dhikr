/* =============================================================
   Dhiker — three-dhikr tasbih sequence
   Subhanallah ×33 → Alhamdulillah ×33 → Allahu Akbar ×34
   Tap anywhere to count. Auto-advances on completion.
   Background images crossfade between dhikrs.
   ============================================================= */

const DHIKRS = [
  {
    arabic:  'سُبْحَانَ ٱللَّهِ',
    name:    'Subhanallah',
    meaning: 'Glory be to Allah',
    target:  33,
    // Beautiful creation: landscapes, wildlife, oceans, nature
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=75', // mountain sunrise
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=75', // rainforest waterfall
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1920&q=75', // fox in snow
      'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=1920&q=75', // lion portrait
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=75', // forest light
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=75', // aurora borealis
      'https://images.unsplash.com/photo-1468276311594-df529070938a?auto=format&fit=crop&w=1920&q=75', // sea turtle
    ],
  },
  {
    arabic:  'ٱلْحَمْدُ لِلَّهِ',
    name:    'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    target:  33,
    // Blessings of life: food, family, health, water, daily gifts
    images: [
      'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1920&q=75', // abundant food table
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1920&q=75', // colourful vegetables
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1920&q=75', // artisan bread
      'https://images.unsplash.com/photo-1511895426328-dc8714191011?auto=format&fit=crop&w=1920&q=75', // happy family
      'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1920&q=75', // clean river / water
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=75', // medical care (health blessing)
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=75', // fruit market
    ],
  },
  {
    arabic:  'ٱللَّهُ أَكْبَرُ',
    name:    'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target:  34,
    // Grandeur of creation: cosmos, dramatic landscapes, oceans
    images: [
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=75', // milky way galaxy
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=75', // dramatic mountain peak
      'https://images.unsplash.com/photo-1484842641800-6767207f4741?auto=format&fit=crop&w=1920&q=75', // northern lights
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=75', // vast ocean horizon
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=75', // desert dunes
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=75', // landscape with rays
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=75', // starry night sky
    ],
  },
];

const STORAGE_KEY = 'dhiker_v3';

const state = {
  dhikrIndex:    0,
  count:         0,
  imageIndices:  [0, 0, 0],  // which image each dhikr is currently showing
  setsCompleted: 0,
  theme:         'dark',
  transitioning: false,      // blocks input during auto-advance animation
};

// Which bg div is currently showing
let activeBgId = 'bgA';

// ── Persistence ────────────────────────────────────────────
function save() {
  const { dhikrIndex, count, imageIndices, setsCompleted, theme } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dhikrIndex, count, imageIndices, setsCompleted, theme }));
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* ignore */ }
}

// ── DOM refs ───────────────────────────────────────────────
const el = {
  bgA:         document.getElementById('bgA'),
  bgB:         document.getElementById('bgB'),
  tapZone:     document.getElementById('tapZone'),
  themeBtn:    document.getElementById('themeBtn'),
  resetBtn:    document.getElementById('resetBtn'),
  sequence:    document.getElementById('sequence'),
  centerBlock: document.getElementById('centerBlock'),
  dhikrArabic: document.getElementById('dhikrArabic'),
  dhikrName:   document.getElementById('dhikrName'),
  dhikrMeaning:document.getElementById('dhikrMeaning'),
  count:       document.getElementById('count'),
  countTarget: document.getElementById('countTarget'),
  beads:       document.getElementById('beads'),
  setsInfo:    document.getElementById('setsInfo'),
};

// ── Background crossfade ───────────────────────────────────
function currentImageUrl() {
  const d = DHIKRS[state.dhikrIndex];
  return d.images[state.imageIndices[state.dhikrIndex] % d.images.length];
}

function setBackground(url, crossfade = false) {
  const activeEl = activeBgId === 'bgA' ? el.bgA : el.bgB;
  const nextId   = activeBgId === 'bgA' ? 'bgB' : 'bgA';
  const nextEl   = nextId     === 'bgA' ? el.bgA : el.bgB;

  if (!crossfade) {
    activeEl.style.backgroundImage = `url('${url}')`;
    activeEl.classList.add('active');
    return;
  }
  nextEl.style.backgroundImage = `url('${url}')`;
  // Trigger layout so transition fires
  nextEl.getBoundingClientRect();
  activeEl.classList.remove('active');
  nextEl.classList.add('active');
  activeBgId = nextId;
}

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
    if (i < state.dhikrIndex) {
      chip.classList.add('is-done');
      chip.textContent = `✓ ${d.name}`;
    } else if (i === state.dhikrIndex) {
      chip.classList.add('is-active');
      chip.textContent = d.name;
    } else {
      chip.textContent = d.name;
    }
    el.sequence.appendChild(chip);
  });
}

// ── Main render ────────────────────────────────────────────
function renderDhikr(animate = false) {
  const d = DHIKRS[state.dhikrIndex];
  el.dhikrArabic.textContent  = d.arabic;
  el.dhikrName.textContent    = d.name;
  el.dhikrMeaning.textContent = d.meaning;
  el.countTarget.textContent  = d.target;
  if (animate) {
    el.centerBlock.classList.remove('entering');
    void el.centerBlock.offsetWidth;
    el.centerBlock.classList.add('entering');
  }
}

function renderCount(pop = false, glow = false) {
  el.count.textContent = state.count;
  if (pop || glow) {
    el.count.classList.remove('pop', 'glow');
    void el.count.offsetWidth;
    el.count.classList.add(glow ? 'glow' : 'pop');
  }
}

function renderSets(message = '') {
  if (message) {
    el.setsInfo.textContent = message;
  } else if (state.setsCompleted > 0) {
    el.setsInfo.textContent = `${state.setsCompleted} set${state.setsCompleted > 1 ? 's' : ''} done`;
  } else {
    el.setsInfo.textContent = '';
  }
}

function renderTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  el.themeBtn.textContent = state.theme === 'dark' ? '☾' : '☀';
}

// ── Full initial render ────────────────────────────────────
function renderAll() {
  renderTheme();
  renderSequence();
  renderDhikr();
  renderCount();
  buildBeads(DHIKRS[state.dhikrIndex].target);
  renderBeads();
  renderSets();
  setBackground(currentImageUrl(), false);
}

// ── Advance to next dhikr ──────────────────────────────────
function advanceDhikr() {
  // Move image pointer for completed dhikr
  const d = DHIKRS[state.dhikrIndex];
  state.imageIndices[state.dhikrIndex] =
    (state.imageIndices[state.dhikrIndex] + 1) % d.images.length;

  const nextIndex     = (state.dhikrIndex + 1) % DHIKRS.length;
  const isSetComplete = nextIndex === 0;
  if (isSetComplete) state.setsCompleted++;

  state.dhikrIndex   = nextIndex;
  state.count        = 0;
  state.transitioning = false;

  const nextUrl = currentImageUrl();
  // Preload then crossfade
  const img = new Image();
  img.onload = img.onerror = () => setBackground(nextUrl, true);
  img.src = nextUrl;

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

// ── Counting actions ───────────────────────────────────────
function increment() {
  if (state.transitioning) return;

  state.count++;
  const target = DHIKRS[state.dhikrIndex].target;
  const done   = state.count >= target;

  renderCount(true, done);
  renderBeads();
  save();

  if (done) {
    state.transitioning = true;
    if (navigator.vibrate) navigator.vibrate([12, 50, 20]);
    setTimeout(advanceDhikr, 850);
  } else {
    if (navigator.vibrate) navigator.vibrate(8);
  }
}

function decrement() {
  if (state.transitioning) return;
  if (state.count === 0) return;
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
  setBackground(currentImageUrl(), true);
  save();
}

// ── Theme ──────────────────────────────────────────────────
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  renderTheme();
  save();
}

// ── Event bindings ─────────────────────────────────────────
function bind() {
  el.tapZone.addEventListener('click', increment);
  el.resetBtn.addEventListener('click', reset);
  el.themeBtn.addEventListener('click', toggleTheme);

  // Keyboard: Space/↑/+ = count, ↓/U = undo, R = reset
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const onButton = e.target.tagName === 'BUTTON';
    if (e.code === 'ArrowUp' || e.key === '+' || e.key === '=' ||
        (e.code === 'Space' && !onButton)) {
      e.preventDefault(); increment();
    } else if (e.code === 'ArrowDown' || e.key === '-' || e.key === 'u' || e.key === 'U') {
      e.preventDefault(); decrement();
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
    }
  });

  // Belt-and-suspenders mobile zoom prevention
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
