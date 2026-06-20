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

// ---- loops + arrangement ----
let loops = [];                // { id, name, pattern:{key:bool[16]}, bassNote }
let arrangement = [];          // ordered list of loop ids
let nextLoopId = 1;
let mode = 'grid';             // 'grid' = live grid · 'arrange' = play the arrangement
let arrIndex = 0;              // next arrangement slot to play
let currentArrLoop = null;     // loop sounding this bar (arrange mode)
const arrQueue = [];           // {slot, time} for the arrangement playhead
let drag = null;               // active drag payload: { from:'tray'|'arr', id, index }

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

function playColumn(pat, bn, step, time) {
  for (const t of TRACKS) {
    if (muted[t.key] || !pat[t.key][step]) continue;
    const fn = kit[t.voice];
    if (t.pitched) fn(time, 1, noteFreq(bn.name, bn.octave));
    else fn(time, 1);
  }
}

function triggerColumn(step, time) {
  if (mode === 'arrange') {
    if (step === 0) advanceArrangement(time);          // swap to the next loop each bar
    if (currentArrLoop) playColumn(currentArrLoop.pattern, currentArrLoop.bassNote, step, time);
  } else {
    playColumn(pattern, bassNote, step, time);
  }
}

function advanceArrangement(time) {
  if (!arrangement.length) { currentArrLoop = null; return; }
  const slot = arrIndex % arrangement.length;
  currentArrLoop = loops.find(l => l.id === arrangement[slot]) || null;
  arrQueue.push({ slot, time });
  arrIndex = (slot + 1) % arrangement.length;
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
    while (arrQueue.length && arrQueue[0].time < ctx.currentTime) {
      highlightArrSlot(arrQueue.shift().slot);
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
function stopPlayback() {
  if (seq) seq.stop();
  playBtn.textContent = '▶ Play'; playBtn.classList.remove('on');
  playArrBtn.textContent = '▶ Play Arrangement'; playArrBtn.classList.remove('on');
  clearHighlight(); clearArrHighlight();
}
playBtn.onclick = () => {
  ensureAudio();
  if (ctx.state === 'suspended') ctx.resume();
  if (seq.playing && mode === 'grid') { stopPlayback(); return; }
  stopPlayback();                                      // (also stops the arrangement if it was running)
  mode = 'grid'; seq.start();
  playBtn.textContent = '■ Stop'; playBtn.classList.add('on');
};
bpmEl.oninput = () => { bpmVal.textContent = bpmEl.value; if (seq) seq.bpm = +bpmEl.value; };
swingEl.oninput = () => { swingVal.textContent = swingEl.value; if (seq) seq.swing = +swingEl.value; };
volEl.oninput = () => { if (master) master.gain.value = +volEl.value; };

document.getElementById('clear').onclick = () => {
  TRACKS.forEach(t => pattern[t.key].fill(false)); syncGrid();
};
document.getElementById('random').onclick = () => {
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

// ---- loops + arrangement UI ----
const saveLoopBtn = document.getElementById('saveLoop');
const loopTray = document.getElementById('loopTray');
const arrTimeline = document.getElementById('arrTimeline');
const playArrBtn = document.getElementById('playArr');
const clearArrBtn = document.getElementById('clearArr');

const persist = () => {
  try { localStorage.setItem('thudworks:loops', JSON.stringify({ loops, arrangement, nextLoopId })); } catch {}
};

saveLoopBtn.onclick = () => {                           // snapshot the current grid as a loop
  const p = {}; TRACKS.forEach(t => p[t.key] = pattern[t.key].slice());
  loops.push({ id: nextLoopId++, name: 'Loop ' + (loops.length + 1), pattern: p, bassNote: { ...bassNote } });
  renderTray(); persist();
};

function loadLoopToGrid(loop) {                         // click a loop to bring it back onto the grid
  TRACKS.forEach(t => pattern[t.key] = loop.pattern[t.key].slice());
  bassNote = { ...loop.bassNote }; noteSel.value = bassNote.name + bassNote.octave;
  syncGrid();
}
function deleteLoop(id) {
  loops = loops.filter(l => l.id !== id);
  arrangement = arrangement.filter(x => x !== id);
  renderTray(); renderArrangement(); persist();
}
function renameLoop(loop) {
  const n = prompt('Rename loop', loop.name);
  if (n && n.trim()) { loop.name = n.trim(); renderTray(); renderArrangement(); persist(); }
}

function renderTray() {
  loopTray.innerHTML = '';
  if (!loops.length) { loopTray.innerHTML = '<span class="hint">save the grid to make a loop →</span>'; return; }
  loops.forEach(loop => {
    const chip = document.createElement('div'); chip.className = 'loopchip'; chip.draggable = true;
    const lbl = document.createElement('span'); lbl.className = 'lc-name'; lbl.textContent = loop.name;
    lbl.title = 'click: load to grid · double-click: rename · drag: add to arrangement';
    lbl.onclick = () => loadLoopToGrid(loop);
    lbl.ondblclick = () => renameLoop(loop);
    chip.appendChild(lbl);
    const x = document.createElement('button'); x.className = 'lc-x'; x.textContent = '×'; x.title = 'delete loop';
    x.onclick = e => { e.stopPropagation(); deleteLoop(loop.id); };
    chip.appendChild(x);
    chip.ondragstart = e => { drag = { from: 'tray', id: loop.id }; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', loop.name); };
    chip.ondragend = () => { drag = null; };
    loopTray.appendChild(chip);
  });
}

function renderArrangement() {
  arrTimeline.innerHTML = '';
  if (!arrangement.length) { arrTimeline.innerHTML = '<span class="hint">drag loops here to build an arrangement</span>'; return; }
  arrangement.forEach((id, i) => {
    const loop = loops.find(l => l.id === id);
    const slot = document.createElement('div'); slot.className = 'slot'; slot.draggable = true;
    const lbl = document.createElement('span'); lbl.textContent = (i + 1) + '. ' + (loop ? loop.name : '?');
    slot.appendChild(lbl);
    const x = document.createElement('button'); x.className = 'lc-x'; x.textContent = '×';
    x.onclick = e => { e.stopPropagation(); arrangement.splice(i, 1); renderArrangement(); persist(); };
    slot.appendChild(x);
    slot.ondragstart = e => { drag = { from: 'arr', index: i }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'arr'); };
    slot.ondragend = () => { drag = null; };
    slot.ondragover = e => { e.preventDefault(); slot.classList.add('over'); };
    slot.ondragleave = () => slot.classList.remove('over');
    slot.ondrop = e => { e.preventDefault(); e.stopPropagation(); slot.classList.remove('over'); handleDrop(i); };
    arrTimeline.appendChild(slot);
  });
}

function handleDrop(targetIndex) {                      // insert/move at targetIndex
  arrTimeline.classList.remove('over');
  if (!drag) return;
  if (drag.from === 'tray') {
    arrangement.splice(targetIndex, 0, drag.id);
  } else {
    const from = drag.index;
    const [moved] = arrangement.splice(from, 1);
    arrangement.splice(from < targetIndex ? targetIndex - 1 : targetIndex, 0, moved);
  }
  drag = null; renderArrangement(); persist();
}
arrTimeline.ondragover = e => { e.preventDefault(); arrTimeline.classList.add('over'); };
arrTimeline.ondragleave = () => arrTimeline.classList.remove('over');
arrTimeline.ondrop = e => { e.preventDefault(); handleDrop(arrangement.length); };   // drop on empty space = append

function highlightArrSlot(slot) {
  document.querySelectorAll('.slot.playing').forEach(s => s.classList.remove('playing'));
  arrTimeline.children[slot]?.classList.add('playing');
}
function clearArrHighlight() {
  document.querySelectorAll('.slot.playing').forEach(s => s.classList.remove('playing'));
}

playArrBtn.onclick = () => {
  ensureAudio();
  if (ctx.state === 'suspended') ctx.resume();
  if (seq.playing && mode === 'arrange') { stopPlayback(); return; }
  if (!arrangement.length) return;
  stopPlayback();
  mode = 'arrange'; arrIndex = 0; currentArrLoop = null; arrQueue.length = 0;
  seq.start();
  playArrBtn.textContent = '■ Stop'; playArrBtn.classList.add('on');
};
clearArrBtn.onclick = () => { arrangement = []; if (mode === 'arrange') stopPlayback(); renderArrangement(); persist(); };

(() => {                                                // restore saved loops/arrangement
  try {
    const s = JSON.parse(localStorage.getItem('thudworks:loops') || 'null');
    if (s && Array.isArray(s.loops)) {
      loops = s.loops; arrangement = s.arrangement || [];
      nextLoopId = s.nextLoopId || (loops.reduce((m, l) => Math.max(m, l.id), 0) + 1);
    }
  } catch {}
})();
renderTray(); renderArrangement();

buildGrid();
PRESETS['Boom Bap'] && (() => {     // start with a beat already on the grid
  const { p, bpm } = PRESETS['Boom Bap'];
  TRACKS.forEach(t => pattern[t.key] = p[t.key] ? P(p[t.key]) : Array(STEPS).fill(false));
  bpmEl.value = bpm; bpmVal.textContent = bpm; syncGrid();
})();
