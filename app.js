// THUDWORKS — app glue: builds the grid, wires transport + controls, draws the playhead.
import { createKit, noteFreq } from './synth.js';
import { Sequencer } from './sequencer.js';

const STEPS = 16;

// tracks (top -> bottom). `voice` names a function on the kit; `pitched` rows follow the bass note.
const TRACKS = [
  { key: 'kick',    label: 'Kick',     voice: 'kick',      color: '#ff4d4d' },
  { key: 'bass',    label: '808 Bass', voice: 'bass',      color: '#ff8a3d', pitched: true },
  { key: 'snare',   label: 'Snare',    voice: 'snare',     color: '#ffd23d' },
  { key: 'clap',    label: 'Clap',     voice: 'clap',      color: '#a3ff3d' },
  { key: 'hatC',    label: 'Hat',      voice: 'hatClosed', color: '#3dffd2' },
  { key: 'hatO',    label: 'Open Hat', voice: 'hatOpen',   color: '#3dc5ff' },
  { key: 'cowbell', label: 'Cowbell',  voice: 'cowbell',   color: '#9d8aff' },
  { key: 'clave',   label: 'Clave',    voice: 'clave',     color: '#ff6ad5' },
  { key: 'tom',     label: 'Tom',      voice: 'tom',       color: '#ff9db1' },
];

// preset patterns. Each string is 16 chars; 'x' = hit. Empty/missing = silent row.
const P = s => Array.from({ length: STEPS }, (_, i) => s[i] === 'x');
const PRESETS = {
  'Boom Bap': { bpm: 88, p: {
    kick:  'x.......x...x...', snare: '....x.......x...',
    hatC:  'x.x.x.x.x.x.x.x.', bass:  'x.......x.......' } },
  'Trap': { bpm: 140, p: {
    kick:  'x.....x...x.....', snare: '........x.......', clap: '........x.......',
    hatC:  'xxxxxxxxxxxxxxxx', hatO: '..........x.....', bass: 'x.....x...x.....' } },
  'House': { bpm: 124, p: {
    kick:  'x...x...x...x...', clap: '....x.......x...',
    hatO:  '..x...x...x...x.', hatC: 'x.x.x.x.x.x.x.x.', bass: 'x...x...x...x...' } },
  'Funk': { bpm: 102, p: {
    kick:  'x..x...x..x.....', snare: '....x.......x...',
    hatC:  'xxxxxxxxxxxxxxxx', cowbell: '....x...x...x...', bass: 'x..x...x..x.....' } },
};

// ---- state ----
let ctx, kit, master, seq;
const pattern = {};            // key -> [bool x16]
const muted = {};              // key -> bool
TRACKS.forEach(t => { pattern[t.key] = Array(STEPS).fill(false); muted[t.key] = false; });
let bassNote = { name: 'C', octave: 2 };
let formula = null;            // compiled (x,y,i,t)=>number when formula mode is on, else null
let formulaBar = 0;            // bar counter fed in as `t` so formulas can evolve over time

// ---- audio bootstrap (must happen on a user gesture) ----
function ensureAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.8;
  const comp = ctx.createDynamicsCompressor();       // glue + soft limit so stacks don't clip
  master.connect(comp).connect(ctx.destination);
  kit = createKit(ctx, master);
  seq = new Sequencer(ctx, triggerColumn);
  seq.bpm = +bpmEl.value;
  seq.swing = +swingEl.value;
  requestAnimationFrame(drawPlayhead);
}

function triggerColumn(step, time) {
  if (formula && step === 0) { recomputeFormula(formulaBar); formulaBar++; }   // evolve each bar
  for (const t of TRACKS) {
    if (muted[t.key] || !pattern[t.key][step]) continue;
    const fn = kit[t.voice];
    if (t.pitched) fn(time, 1, noteFreq(bassNote.name, bassNote.octave));
    else fn(time, 1);
  }
}

// ---- DOM ----
const grid = document.getElementById('grid');
const bpmEl = document.getElementById('bpm');
const bpmVal = document.getElementById('bpmVal');
const swingEl = document.getElementById('swing');
const swingVal = document.getElementById('swingVal');
const volEl = document.getElementById('vol');
const playBtn = document.getElementById('play');
const cells = {};              // key -> [button x16]

function buildGrid() {
  for (const t of TRACKS) {
    const row = document.createElement('div'); row.className = 'row';
    const name = document.createElement('button');
    name.className = 'name'; name.textContent = t.label;
    name.style.setProperty('--c', t.color);
    name.onclick = () => { muted[t.key] = !muted[t.key]; name.classList.toggle('muted', muted[t.key]); };
    row.appendChild(name);

    const steps = document.createElement('div'); steps.className = 'steps';
    cells[t.key] = [];
    for (let i = 0; i < STEPS; i++) {
      const c = document.createElement('button');
      c.className = 'cell' + (Math.floor(i / 4) % 2 ? ' beatB' : ' beatA');
      c.style.setProperty('--c', t.color);
      c.onclick = () => {
        ensureAudio();
        disengageFormula();                            // manual edit takes over from the formula
        pattern[t.key][i] = !pattern[t.key][i];
        c.classList.toggle('on', pattern[t.key][i]);
        if (pattern[t.key][i]) {                       // audition the hit
          const fn = kit[t.voice];
          t.pitched ? fn(ctx.currentTime, 1, noteFreq(bassNote.name, bassNote.octave)) : fn(ctx.currentTime, 1);
        }
      };
      cells[t.key].push(c); steps.appendChild(c);
    }
    row.appendChild(steps); grid.appendChild(row);
  }
}

function syncGrid() {
  for (const t of TRACKS)
    cells[t.key].forEach((c, i) => c.classList.toggle('on', pattern[t.key][i]));
}

// ---- visual playhead ----
let lastCol = -1;
function drawPlayhead() {
  if (seq && seq.playing) {
    while (seq.queue.length && seq.queue[0].time < ctx.currentTime) {
      const col = seq.queue.shift().step;
      if (col !== lastCol) { highlight(col); lastCol = col; }
    }
  }
  requestAnimationFrame(drawPlayhead);
}
function highlight(col) {
  document.querySelectorAll('.cell.playing').forEach(c => c.classList.remove('playing'));
  for (const t of TRACKS) cells[t.key][col]?.classList.add('playing');
}
function clearHighlight() {
  document.querySelectorAll('.cell.playing').forEach(c => c.classList.remove('playing'));
  lastCol = -1;
}

// ---- controls ----
playBtn.onclick = () => {
  ensureAudio();
  if (ctx.state === 'suspended') ctx.resume();
  if (seq.playing) { seq.stop(); playBtn.textContent = '▶ Play'; playBtn.classList.remove('on'); clearHighlight(); }
  else { formulaBar = 0; seq.start(); playBtn.textContent = '■ Stop'; playBtn.classList.add('on'); }
};
bpmEl.oninput = () => { bpmVal.textContent = bpmEl.value; if (seq) seq.bpm = +bpmEl.value; };
swingEl.oninput = () => { swingVal.textContent = swingEl.value; if (seq) seq.swing = +swingEl.value; };
volEl.oninput = () => { if (master) master.gain.value = +volEl.value; };

document.getElementById('clear').onclick = () => {
  disengageFormula();
  TRACKS.forEach(t => pattern[t.key].fill(false)); syncGrid();
};
document.getElementById('random').onclick = () => {
  disengageFormula();
  const density = { kick: .25, snare: .12, clap: .08, hatC: .55, hatO: .12,
                    cowbell: .1, clave: .1, tom: .08, bass: .22 };
  TRACKS.forEach(t => pattern[t.key] = Array.from({ length: STEPS }, () => Math.random() < (density[t.key] || .2)));
  syncGrid();
};

// preset buttons
const presetBar = document.getElementById('presets');
Object.keys(PRESETS).forEach(name => {
  const b = document.createElement('button'); b.textContent = name; b.className = 'preset';
  b.onclick = () => {
    disengageFormula();
    const { bpm, p } = PRESETS[name];
    TRACKS.forEach(t => pattern[t.key] = p[t.key] ? P(p[t.key]) : Array(STEPS).fill(false));
    bpmEl.value = bpm; bpmVal.textContent = bpm; if (seq) seq.bpm = bpm;
    syncGrid();
  };
  presetBar.appendChild(b);
});

// bass note picker
const noteSel = document.getElementById('bassNote');
['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(n =>
  [1, 2, 3].forEach(o => {
    const opt = document.createElement('option');
    opt.value = `${n}${o}`; opt.textContent = `${n}${o}`;
    if (n === 'C' && o === 2) opt.selected = true;
    noteSel.appendChild(opt);
  }));
noteSel.onchange = () => {
  const m = noteSel.value.match(/^([A-G]#?)(\d)$/);
  bassNote = { name: m[1], octave: +m[2] };
};

// ---- formula mode (tixy-style: type math, it draws the beat) ----
// Each cell evaluates ƒ with x = step (0-15), y = row (0 = top track, Kick),
// i = y*16+x, t = bar counter. A cell fires when the result is positive/true.
// Math is in scope, so `sin`, `floor`, `PI` etc. work bare. Formulas that use
// `t` evolve every bar while playing; ones that don't stay put.
const fxEl = document.getElementById('fx');
const fxErr = document.getElementById('fxErr');

const compileFormula = src => new Function('x', 'y', 'i', 't', 'with (Math) { return (' + src + '); }');

function recomputeFormula(t, draw = true) {
  if (!formula) return;
  try {
    TRACKS.forEach((tr, y) => {
      for (let x = 0; x < STEPS; x++) pattern[tr.key][x] = formula(x, y, y * STEPS + x, t) > 0;
    });
  } catch (e) { setFormulaError(e.message); return; }
  if (draw) syncGrid();
}

function setFormula(src) {
  src = src.trim();
  if (!src) { disengageFormula(); return; }
  let fn;
  try { fn = compileFormula(src); fn(0, 0, 0, 0); }   // compile + smoke-test before committing
  catch (e) { setFormulaError(e.message); return; }
  formula = fn; formulaBar = 0; setFormulaError('');
  recomputeFormula(0);
}

function disengageFormula() { formula = null; setFormulaError(''); }

function setFormulaError(msg) {
  fxErr.textContent = msg ? '⚠' : '';
  fxEl.classList.toggle('err', !!msg);
  fxEl.title = msg || '';
}

fxEl.oninput = () => setFormula(fxEl.value);

const EXAMPLES = ['(x+y)%4==0', '(x&y)==0', 'x%(y+2)==0', 'y<2 && x%4==0', 'sin(x/2+t)>0.5'];
const fxEx = document.getElementById('fxEx');
EXAMPLES.forEach(src => {
  const b = document.createElement('button');
  b.className = 'chip'; b.textContent = src;
  b.onclick = () => { fxEl.value = src; setFormula(src); };
  fxEx.appendChild(b);
});

buildGrid();
PRESETS['Boom Bap'] && (() => {     // start with a beat already on the grid
  const { p, bpm } = PRESETS['Boom Bap'];
  TRACKS.forEach(t => pattern[t.key] = p[t.key] ? P(p[t.key]) : Array(STEPS).fill(false));
  bpmEl.value = bpm; bpmVal.textContent = bpm; syncGrid();
})();
