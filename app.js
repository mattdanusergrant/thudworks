// THUDWORKS — app glue: a code editor that compiles to a song, transport, examples.
import { createKit } from './synth.js';
import { compile, SongPlayer } from './song.js';
import { EXAMPLES } from './examples.js';

let ctx, kit, master, player;

const codeEl = document.getElementById('code');
const playBtn = document.getElementById('play');
const volEl = document.getElementById('vol');
const statusEl = document.getElementById('status');

function ensureAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = +volEl.value;
  const comp = ctx.createDynamicsCompressor();            // glue + soft limit so stacks don't clip
  master.connect(comp).connect(ctx.destination);
  kit = createKit(ctx, master);
  player = new SongPlayer(ctx, kit);
  requestAnimationFrame(tickStatus);
}

function setStatus(msg, error = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('err', error);
}

function stop() {
  if (player) player.stop();
  playBtn.textContent = '▶ Play'; playBtn.classList.remove('on');
}

// Compile what's in the editor and start playing it. Returns true on success.
function run() {
  ensureAudio();
  if (ctx.state === 'suspended') ctx.resume();
  player.stop();
  let song;
  try { song = compile(codeEl.value); }
  catch (e) { setStatus('⚠ ' + e.message, true); playBtn.textContent = '▶ Play'; playBtn.classList.remove('on'); return false; }
  player.load(song);
  player.start();
  playBtn.textContent = '■ Stop'; playBtn.classList.add('on');
  return true;
}

playBtn.onclick = () => { if (player && player.playing) stop(); else run(); };
volEl.oninput = () => { if (master) master.gain.value = +volEl.value; };

// live status: tempo + bar while playing
function tickStatus() {
  if (player && player.playing) setStatus(`♪ ${player.bpm} bpm · bar ${player.bar()} / ${player.bars}`);
  requestAnimationFrame(tickStatus);
}

// example songs — load into the editor and play immediately
const exBar = document.getElementById('examples');
EXAMPLES.forEach((ex, i) => {
  const b = document.createElement('button'); b.className = 'ex'; b.textContent = ex.name;
  b.onclick = () => { codeEl.value = ex.code.trim(); run(); };
  exBar.appendChild(b);
});

// boot with the first example loaded (but not playing) so the screen isn't empty
codeEl.value = EXAMPLES[0].code.trim();
setStatus('press ▶ Play — or pick a song above');
