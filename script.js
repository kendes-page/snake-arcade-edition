/* UTILS */
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pad3 = n => String(Math.max(0, Math.floor(n))).padStart(3, '0');

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

/* TOUCH DETECTION
   Show the d-pad only when a touch device is detected.
   We check once on load, then also listen for a first touch. */
let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

function applyTouchUI() {
  if (isTouchDevice) {
    // Mobile show d-pad, hide keyboard hint
    $('dpad').style.display = 'grid';
    $('ctrlHint').style.display = 'none';
  } else {
    // Desktop hide d-pad, show keyboard hint
    $('dpad').style.display = 'none';
    $('ctrlHint').style.display = '';
  }
}

window.addEventListener('touchstart', () => {
  if (!isTouchDevice) { isTouchDevice = true; applyTouchUI(); }
}, { once: true, passive: true });

applyTouchUI();

/* INTRO BACKGROUND — animated grid + orbs */
(function buildIntroBg() {
  const bg = $('introBg');
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'grid-line h';
    el.style.top = (i * 5.8) + '%';
    bg.appendChild(el);
  }
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'grid-line v';
    el.style.left = (i * 3.7) + '%';
    bg.appendChild(el);
  }
  ['#00ff9f', '#ff006e', '#00d4ff', '#ffe600', '#bf00ff'].forEach(color => {
    const orb = document.createElement('div');
    orb.className = 'orb';
    const s = rnd(180, 480);
    orb.style.cssText = `width:${s}px;height:${s}px;background:${color};left:${rnd(-80, window.innerWidth)}px;top:${rnd(-80, window.innerHeight)}px;animation-duration:${rnd(14, 30)}s;animation-delay:${rnd(0, 8)}s;`;
    bg.appendChild(orb);
  });
})();

/* INTRO DEMO SNAKE */
(function introSnakeDemo() {
  const cv = $('introCanvas');
  const cx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const CELL = 10, COLS = W / CELL, ROWS = H / CELL;
  let body = [];
  for (let i = 16; i >= 0; i--) body.push({ x: i, y: Math.floor(ROWS / 2) });
  let dir = { x: 1, y: 0 };
  let food = { x: 24, y: Math.floor(ROWS / 2) };
  let tick = 0;
  (function frame() {
    cx.clearRect(0, 0, W, H);
    const fp = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    cx.save(); cx.shadowBlur = 14 * fp; cx.shadowColor = '#ff006e'; cx.fillStyle = '#ff006e';
    cx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4); cx.restore();
    body.forEach((s, i) => {
      const a = 1 - (i / body.length) * 0.6;
      cx.save();
      cx.shadowBlur = i === 0 ? 14 : 5;
      cx.shadowColor = i === 0 ? '#00d4ff' : '#00ff9f';
      cx.fillStyle = i === 0 ? `rgba(0,212,255,${a})` : `rgba(0,255,159,${a})`;
      const p = i === 0 ? 1 : 2;
      cx.fillRect(s.x * CELL + p, s.y * CELL + p, CELL - p * 2, CELL - p * 2);
      cx.restore();
    });
    if (++tick % 6 === 0) {
      const h = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (h.x < 0 || h.x >= COLS) { dir.x *= -1; h.x = body[0].x + dir.x; }
      if (h.y < 0 || h.y >= ROWS) { dir.y *= -1; h.y = body[0].y + dir.y; }
      if (h.x === food.x && h.y === food.y) {
        food = { x: Math.floor(rnd(1, COLS - 1)), y: Math.floor(rnd(0, ROWS)) };
      } else { body.pop(); }
      body.unshift(h);
      if (Math.random() < 0.18) {
        const dirs = [{ x:1,y:0 }, { x:-1,y:0 }, { x:0,y:1 }, { x:0,y:-1 }];
        const nd = dirs[Math.floor(Math.random() * 4)];
        if (nd.x !== -dir.x || nd.y !== -dir.y) dir = nd;
      }
    }
    requestAnimationFrame(frame);
  })();
})();

/* INTRO NAVIGATION */
$('btnPlaySnake').onclick = () => { showPage('gamePage'); setupGame(); };

document.addEventListener('keydown', e => {
  if (!$('introPage').classList.contains('hidden')) {
    showPage('gamePage');
    setupGame();
  }
});

/* SOUND ENGINE — Web Audio API synthesized */
let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended (required after user gesture on mobile)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type, duration, vol = 0.3) {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch(e) {}
}

function sfxEat() {
  playTone(440, 'square', 0.08, 0.25);
  setTimeout(() => playTone(660, 'square', 0.08, 0.20), 60);
  setTimeout(() => playTone(880, 'square', 0.10, 0.18), 120);
}
function sfxSpecial() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playTone(f, 'sawtooth', 0.12, 0.15), i * 55));
}
function sfxDie() {
  try {
    const ac = getAudio();
    const buf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 180;
    src.buffer = buf;
    src.connect(filter); filter.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.4, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6);
    src.start(); src.stop(ac.currentTime + 0.6);
  } catch(e) {}
  [110, 82, 65].forEach((f, i) =>
    setTimeout(() => playTone(f, 'sawtooth', 0.2, 0.22), i * 80));
}
function sfxPause() {
  playTone(300, 'sine', 0.12, 0.2);
  setTimeout(() => playTone(200, 'sine', 0.15, 0.18), 100);
}
function sfxStart() {
  [330, 392, 523, 659, 784].forEach((f, i) =>
    setTimeout(() => playTone(f, 'square', 0.14, 0.22), i * 70));
}
function sfxLevelUp() {
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    setTimeout(() => playTone(f, 'sawtooth', 0.18, 0.16), i * 50));
}

/* SPEED CONTROL */
let speedMult = 1.0;

function baseStepMs() { return Math.max(55, 165 - (gLevel - 1) * 12); }
function stepMs()      { return Math.max(40, Math.round(baseStepMs() / speedMult)); }

function setSpeed(mult) {
  speedMult = mult;
  document.querySelectorAll('.spd-btn').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.speed) === mult);
  });
}

function lockSpeed()   { $('settingsBar').classList.add('locked'); }
function unlockSpeed() { $('settingsBar').classList.remove('locked'); }

document.querySelectorAll('.spd-btn').forEach(b => {
  b.addEventListener('click', () => setSpeed(parseFloat(b.dataset.speed)));
});

/* DYNAMIC CANVAS SIZING
   Calculates the largest square grid that fits the
   available screen space, keeping cells whole pixels. */
const COLS = 20;
const ROWS = 20;

let CELL = 25;  // recalculated by calcLayout()
let GW = CELL * COLS;
let GH = CELL * ROWS;

function calcLayout() {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  if (!isTouchDevice) {
    // Desktop fixed 500×500 canvas (25px cells), no dpad
    CELL = 25;
    GW = CELL * COLS;
    GH = CELL * ROWS;
    document.documentElement.style.setProperty('--cell-size', CELL + 'px');
    return;
  }

  // Mobile scale canvas to fit screen with dpad below
  const topPad = Math.max(parseInt(getComputedStyle($('gamePage')).paddingTop) || 50, 50);
  const hudH   = 36;
  const speedH = 46;
  const dpadH  = calcDpadSize() + 10;
  const botPad = 10;

  const availH = vh - topPad - hudH - speedH - dpadH - botPad;
  const availW = vw - 8;

  const cellByH = Math.floor(availH / ROWS);
  const cellByW = Math.floor(availW / COLS);
  CELL = Math.max(10, Math.min(cellByH, cellByW, 28));

  GW = CELL * COLS;
  GH = CELL * ROWS;

  document.documentElement.style.setProperty('--cell-size', CELL + 'px');

  // Size dpad buttons based on available space
  const dpadBtnSize = Math.max(46, Math.min(CELL * 1.8, 60));
  $('dpad').style.gridTemplateColumns = `repeat(3, ${dpadBtnSize}px)`;
  $('dpad').style.gridTemplateRows    = `repeat(3, ${dpadBtnSize}px)`;
}

function calcDpadSize() {
  const btnSize = Math.max(46, Math.min(CELL * 1.8, 60));
  return btnSize * 3 + 14;
}

/* SNAKE GAME — single rAF loop with delta-time */
let snake, sDir, nextDir, gFood, gSpecial;
let gScore = 0, gBest = 0, gLevel = 1;
let gRunning = false, gPaused = false;
let gAF = null, lastTime = 0, stepAcc = 0;
let gParts = [], gFlash = 0;

try { gBest = parseInt(localStorage.getItem('snakeBest')) || 0; } catch(e) {}

/* ── Setup / reset ── */
function setupGame() {
  calcLayout();

  const cv  = $('gameCanvas');
  cv.width  = GW;
  cv.height = GH;

  gRunning  = false; gPaused = false;
  unlockSpeed();
  snake = null; gParts = []; gFlash = 0;

  $('bestVal').textContent  = pad3(gBest);
  $('scoreVal').textContent = pad3(0);
  $('levelVal').textContent = pad3(1);

  showOvl('READY?', 'ARROWS / WASD / D-PAD / SWIPE', false);

  if (gAF) cancelAnimationFrame(gAF);
  lastTime = 0; stepAcc = 0;
  gAF = requestAnimationFrame(gameLoop);
}

function showOvl(title, msg, star, starTxt) {
  $('oTitle').textContent     = title;
  $('oMsg').textContent       = msg;
  $('oStar').style.display    = star ? 'block' : 'none';
  if (star) $('oStar').textContent = starTxt || '';
  $('gOverlay').style.display = 'flex';
}
function hideOvl() { $('gOverlay').style.display = 'none'; }

function updateHUD() {
  $('scoreVal').textContent = pad3(gScore);
  $('bestVal').textContent  = pad3(gBest);
  $('levelVal').textContent = pad3(gLevel);
}

/* ── Food placement ── */
function placeGFood() {
  let p;
  do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some(s => s.x === p.x && s.y === p.y));
  gFood = p;
  if (gScore > 0 && gScore % 50 === 0) {
    let sp;
    do { sp = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (snake.some(s => s.x === sp.x && s.y === sp.y) || (sp.x === gFood.x && sp.y === gFood.y));
    gSpecial = { ...sp, timer: 140 };
  }
}

/* ── Particle burst ── */
function burst(gx, gy, color, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 / n) * i + Math.random() * 0.5;
    const sp = 1.5 + Math.random() * 3.5;
    gParts.push({ x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
  }
}

/* ── One logical game step ── */
function doStep() {
  sDir = { ...nextDir };
  const head = { x: snake[0].x + sDir.x, y: snake[0].y + sDir.y };
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { killSnake(); return; }
  if (snake.some(s => s.x === head.x && s.y === head.y)) { killSnake(); return; }
  snake.unshift(head);
  let ate = false;
  if (head.x === gFood.x && head.y === gFood.y) {
    gScore += 10; gFlash = 5;
    burst(gFood.x, gFood.y, '#00ff9f');
    const prevLevel = gLevel;
    gLevel = Math.floor(gScore / 60) + 1;
    placeGFood(); updateHUD(); ate = true;
    sfxEat();
    if (gLevel > prevLevel) sfxLevelUp();
  }
  if (gSpecial && head.x === gSpecial.x && head.y === gSpecial.y) {
    gScore += 30; burst(gSpecial.x, gSpecial.y, '#ff006e', 18);
    gSpecial = null; updateHUD(); ate = true; sfxSpecial();
  }
  if (!ate) snake.pop();
  if (gSpecial) { gSpecial.timer--; if (gSpecial.timer <= 0) gSpecial = null; }
}

/* ── Kill snake ── */
function killSnake() {
  gRunning = false; unlockSpeed(); sfxDie();
  if (gScore > gBest) {
    gBest = gScore;
    try { localStorage.setItem('snakeBest', gBest); } catch(e) {}
  }
  updateHUD();
  snake.forEach(s => burst(s.x, s.y, '#ff006e', 5));
  setTimeout(() => {
    showOvl('GAME OVER', `SCORE: ${pad3(gScore)}`, gScore >= gBest && gScore > 0, '★  NEW BEST  ★');
    $('btnStart').textContent = 'RETRY';
  }, 700);
}

/* ── Single rAF loop ── */
function gameLoop(ts) {
  if ($('gamePage').classList.contains('hidden')) { gAF = requestAnimationFrame(gameLoop); return; }
  const dt = lastTime ? Math.min(ts - lastTime, 200) : 0;
  lastTime = ts;
  if (gRunning && !gPaused) {
    stepAcc += dt;
    const ms = stepMs();
    while (stepAcc >= ms) { doStep(); stepAcc -= ms; if (!gRunning) break; }
  }
  drawGame();
  gAF = requestAnimationFrame(gameLoop);
}

/* ── Render ── */
function drawGame() {
  const cv = $('gameCanvas'); if (!cv) return;
  const cx = cv.getContext('2d');
  cx.clearRect(0, 0, GW, GH);
  if (!snake) return;

  if (gFlash > 0) { cx.fillStyle = `rgba(0,255,159,${gFlash * 0.03})`; cx.fillRect(0, 0, GW, GH); gFlash--; }

  // food
  const fp = 0.7 + 0.3 * Math.sin(Date.now() / 200);
  cx.save(); cx.shadowBlur = 22 * fp; cx.shadowColor = '#00ff9f'; cx.fillStyle = '#00ff9f';
  cx.fillRect(gFood.x * CELL + Math.round(CELL * 0.16), gFood.y * CELL + Math.round(CELL * 0.16), CELL - Math.round(CELL * 0.32), CELL - Math.round(CELL * 0.32));
  cx.restore();

  // special food
  if (gSpecial) {
    const sf = 0.6 + 0.4 * Math.sin(Date.now() / 110);
    cx.save(); cx.shadowBlur = 24 * sf; cx.shadowColor = '#ff006e'; cx.fillStyle = '#ff006e';
    cx.fillRect(gSpecial.x * CELL + Math.round(CELL * 0.12), gSpecial.y * CELL + Math.round(CELL * 0.12), CELL - Math.round(CELL * 0.24), CELL - Math.round(CELL * 0.24));
    cx.restore();
    cx.fillStyle = 'rgba(255,0,110,0.35)';
    cx.fillRect(gSpecial.x * CELL, gSpecial.y * CELL + CELL - 3, CELL * (gSpecial.timer / 140), 3);
  }

  // snake
  snake.forEach((seg, i) => {
    const alpha = 1 - (i / snake.length) * 0.55, isHead = i === 0;
    cx.save();
    cx.shadowBlur  = isHead ? 18 : 7;
    cx.shadowColor = isHead ? '#00d4ff' : '#00ff9f';
    cx.fillStyle   = isHead ? `rgba(0,212,255,${alpha})` : `rgba(0,255,159,${alpha})`;
    const pad = isHead ? Math.max(1, Math.round(CELL * 0.04)) : Math.max(2, Math.round(CELL * 0.12));
    cx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
    if (isHead) {
      cx.fillStyle = '#04040f';
      const cx2 = seg.x * CELL + CELL / 2, cy2 = seg.y * CELL + CELL / 2;
      const ex = sDir.x, ey = sDir.y, px = -ey, py = ex;
      const eo = CELL * 0.2, er = Math.max(1.5, CELL * 0.1);
      cx.beginPath(); cx.arc(cx2 + ex * eo + px * eo * 0.5, cy2 + ey * eo + py * eo * 0.5, er, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.arc(cx2 + ex * eo - px * eo * 0.5, cy2 + ey * eo - py * eo * 0.5, er, 0, Math.PI * 2); cx.fill();
    }
    cx.restore();
  });

  // particles
  gParts = gParts.filter(p => p.life > 0);
  gParts.forEach(p => {
    cx.save(); cx.globalAlpha = p.life; cx.fillStyle = p.color;
    cx.shadowBlur = 7; cx.shadowColor = p.color;
    cx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5); cx.restore();
    p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.045;
  });

  // pause button
  if (gPaused) {
    cx.fillStyle = 'rgba(0,255,159,0.08)'; cx.fillRect(0, 0, GW, GH);
    cx.fillStyle = '#00ff9f'; cx.font = `bold ${Math.max(28, CELL * 1.3)}px "Bebas Neue", cursive`;
    cx.textAlign = 'center'; cx.shadowBlur = 22; cx.shadowColor = '#00ff9f';
    cx.fillText('PAUSED', GW / 2, GH / 2 + 14); cx.shadowBlur = 0;
  }
}

/* CONFIRM RESTART + COUNTDOWN */
let countdownTimer = null;

function askRestart() {
  if (!gRunning || !snake) { beginSnakeWithCountdown(); return; }
  gPaused = true;
  $('confirmOverlay').style.display = 'flex';
  playTone(300, 'sine', 0.1, 0.15);
}

function cancelRestart() {
  $('confirmOverlay').style.display = 'none';
  gPaused = false;
}

function beginSnakeWithCountdown() {
  $('confirmOverlay').style.display = 'none';
  $('gOverlay').style.display       = 'none';

  snake   = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  sDir    = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
  gScore  = 0; gLevel = 1; gSpecial = null; gParts = []; gFlash = 0; stepAcc = 0;
  placeGFood(); updateHUD(); lockSpeed();
  gRunning = false; gPaused = false;

  const ovl = $('countdownOverlay');
  const num = $('countdownNum');
  ovl.style.display = 'flex';
  let count = 3;

  function tick() {
    if (count > 0) {
      num.className = 'countdown-num';
      num.textContent = count;
      void num.offsetWidth; // force reflow for animation replay
      num.className = 'countdown-num';
      playTone(440 + (3 - count) * 110, 'square', 0.12, 0.18);
      count--;
      countdownTimer = setTimeout(tick, 900);
    } else {
      num.className = 'countdown-num go';
      num.textContent = 'GO!';
      void num.offsetWidth;
      num.className = 'countdown-num go';
      playTone(880, 'square', 0.2, 0.28);
      countdownTimer = setTimeout(() => {
        ovl.style.display = 'none';
        gRunning = true;
        sfxStart();
      }, 700);
    }
  }

  if (countdownTimer) clearTimeout(countdownTimer);
  tick();
}

/* BUTTON HANDLERS */
$('btnStart').onclick      = () => { beginSnakeWithCountdown(); };
$('btnGameHome').onclick   = () => { gRunning = false; if (countdownTimer) clearTimeout(countdownTimer); showPage('introPage'); };
$('gameHomeBtn').onclick   = () => { gRunning = false; if (countdownTimer) clearTimeout(countdownTimer); showPage('introPage'); };
$('btnConfirmYes').onclick = () => { beginSnakeWithCountdown(); };
$('btnConfirmNo').onclick  = () => { cancelRestart(); };

// Mobile pad direction buttons
document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
  // Use touchstart for instant response (no 300ms delay)
  const handler = (e) => {
    e.preventDefault();
    getAudio(); // wake audio context on first touch
    const m = { UP: { x:0,y:-1 }, DOWN: { x:0,y:1 }, LEFT: { x:-1,y:0 }, RIGHT: { x:1,y:0 } };
    const nd = m[btn.dataset.dir];
    if (nd && sDir && (nd.x !== -sDir.x || nd.y !== -sDir.y)) nextDir = nd;
  };
  btn.addEventListener('touchstart', handler, { passive: false });
  btn.addEventListener('click', handler);
});

// Mobile pause button
const pauseHandler = (e) => {
  e.preventDefault();
  if (gRunning) { gPaused = !gPaused; sfxPause(); }
};
$('btnPauseMobile').addEventListener('touchstart', pauseHandler, { passive: false });
$('btnPauseMobile').addEventListener('click', pauseHandler);

// Mobile restart button
const restartHandler = (e) => {
  e.preventDefault();
  if (gRunning || snake) askRestart();
};
$('btnRestartMobile').addEventListener('touchstart', restartHandler, { passive: false });
$('btnRestartMobile').addEventListener('click', restartHandler);

/* KEYBOARD CONTROLS */
document.addEventListener('keydown', e => {
  if ($('gamePage').classList.contains('hidden')) return;

  const map = {
    ArrowUp:    { x:0,y:-1 }, w: { x:0,y:-1 }, W: { x:0,y:-1 },
    ArrowDown:  { x:0,y:1  }, s: { x:0,y:1  }, S: { x:0,y:1  },
    ArrowLeft:  { x:-1,y:0 }, a: { x:-1,y:0 }, A: { x:-1,y:0 },
    ArrowRight: { x:1,y:0  }, d: { x:1,y:0  }, D: { x:1,y:0  },
  };
  if (map[e.key]) {
    const nd = map[e.key];
    if (!sDir || (nd.x !== -sDir.x || nd.y !== -sDir.y)) nextDir = nd;
    e.preventDefault();
  }
  if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
    if ($('confirmOverlay').style.display !== 'none') { cancelRestart(); return; }
  }
  if ((e.key === 'p' || e.key === 'P') && gRunning) { gPaused = !gPaused; sfxPause(); }
  if ((e.key === 'r' || e.key === 'R') && gRunning)   askRestart();
});

/* SWIPE GESTURES on the arena */
(function setupSwipe() {
  const arena = $('arena');
  let tx = 0, ty = 0;
  const MIN_SWIPE = 20; // px threshold

  arena.addEventListener('touchstart', e => {
    getAudio(); // wake audio on first touch
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });

  arena.addEventListener('touchend', e => {
    if (!gRunning) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return;
    let nd;
    if (Math.abs(dx) > Math.abs(dy)) {
      nd = dx > 0 ? { x:1,y:0 } : { x:-1,y:0 };
    } else {
      nd = dy > 0 ? { x:0,y:1 } : { x:0,y:-1 };
    }
    if (sDir && (nd.x !== -sDir.x || nd.y !== -sDir.y)) nextDir = nd;
  }, { passive: true });
})();

/* RESIZE — recalculate layout when screen size changes */
window.addEventListener('resize', () => {
  if (!$('gamePage').classList.contains('hidden')) {
    calcLayout();
    const cv = $('gameCanvas');
    cv.width  = GW;
    cv.height = GH;
    applyTouchUI();
  }
});