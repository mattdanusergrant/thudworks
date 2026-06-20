// THUDWORKS — the song language + player.
//
// A song is plain code. You call play(instrument, pattern, opts?) for each part;
// tempo()/swing() set the clock. Patterns are read one 16th-note per cell:
//
//   drums    — one character per step:  'x' (or any non-'.') = hit, '.' = rest.
//              spaces are ignored, so you can group beats:  "x... x... x... x..."
//   pitched  — whitespace-separated tokens, one per step:
//              note "C4" / "F#3" / "Bb2" = play it, '.' = rest, '-' = hold (tie).
//
// Every part loops to fill the longest part, so a 1-bar drum loop repeats under a
// 16-bar melody automatically. Build arrangements by composing strings with rep().

import { noteFreq } from './synth.js';

// instrument name -> { fn: kit method, pitched, opts: default voice tweaks }
const VOICES = {
  kick:    { fn: 'kick',      pitched: false },
  snare:   { fn: 'snare',     pitched: false },
  clap:    { fn: 'clap',      pitched: false },
  hat:     { fn: 'hatClosed', pitched: false },
  openhat: { fn: 'hatOpen',   pitched: false },
  cowbell: { fn: 'cowbell',   pitched: false },
  clave:   { fn: 'clave',     pitched: false },
  tom:     { fn: 'tom',       pitched: false },
  bass:    { fn: 'bass',      pitched: true  },                                   // 808 sub
  synth:   { fn: 'synth',     pitched: true  },
  lead:    { fn: 'synth',     pitched: true, opts: { wave: 'sawtooth', cutoff: 3500, detune: 8 } },
  pad:     { fn: 'synth',     pitched: true, opts: { wave: 'sawtooth', cutoff: 1400, detune: 12 } },
  pluck:   { fn: 'synth',     pitched: true, opts: { wave: 'triangle', cutoff: 2400, detune: 4 } },
};
export const INSTRUMENTS = Object.keys(VOICES);

const FLAT = { Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
function tokenFreq(tok) {
  const m = tok.match(/^([A-Ga-g])([#b]?)(-?\d)$/);
  if (!m) throw new Error(`bad note "${tok}"`);
  let name = m[1].toUpperCase() + (m[2] || '');
  if (name.length === 2 && name[1] === 'b') name = FLAT[name] || name;
  return noteFreq(name, +m[3]);
}

const parseDrum = str => [...str].filter(c => !/\s/.test(c)).map(c => (c === '.' || c === '_' ? null : { vel: 1 }));
const parsePitched = str => str.trim().split(/\s+/).filter(Boolean).map(t =>
  (t === '.' || t === '_') ? { rest: true }
  : (t === '-' || t === '~') ? { tie: true }
  : { freq: tokenFreq(t) });

// Run the user's code with the DSL helpers in scope; collect the parts.
export function compile(code) {
  let bpm = 120, swing = 0;
  const tracks = [];
  const rep = (s, n) => Array.from({ length: n }, () => s).join(' ');
  const euclid = (hits, steps, rot = 0) => {                                     // even-spread rhythm
    let s = '';
    for (let i = 0; i < steps; i++) s += ((i * hits) % steps) < hits ? 'x' : '.';
    return s.slice(rot % steps) + s.slice(0, rot % steps);
  };
  const tempo = v => { bpm = +v; };
  const swingFn = v => { swing = +v; };
  const play = (inst, pattern, opts = {}) => {
    const meta = VOICES[inst];
    if (!meta) throw new Error(`unknown instrument "${inst}" — try: ${INSTRUMENTS.join(', ')}`);
    const cells = meta.pitched ? parsePitched(pattern) : parseDrum(pattern);
    if (!cells.length) throw new Error(`"${inst}" pattern is empty`);
    tracks.push({ meta, cells, opts });
  };
  new Function('tempo', 'swing', 'play', 'rep', 'euclid', code)(tempo, swingFn, play, rep, euclid);
  if (!tracks.length) throw new Error('no play() calls — nothing to play');
  return { bpm: Math.max(20, bpm), swing: Math.min(70, Math.max(0, swing)), tracks };
}

export class SongPlayer {
  constructor(ctx, kit) { this.ctx = ctx; this.kit = kit; this.playing = false; this.timer = null; }

  load(song) {
    this.bpm = song.bpm;
    const six = (60 / song.bpm) / 4;
    const cells = Math.max(...song.tracks.map(t => t.cells.length));
    this.six = six; this.bars = Math.ceil(cells / 16); this.songDur = cells * six;

    const events = [];
    for (const tr of song.tracks) {
      const n = tr.cells.length, gain = tr.opts.gain ?? 1, fn = this.kit[tr.meta.fn];
      for (let c = 0; c < cells; c++) {
        const cell = tr.cells[c % n];
        if (!cell || cell.rest || cell.tie) continue;
        const time = c * six + (c % 2 ? six * (song.swing / 100) : 0);
        if (tr.meta.pitched) {
          let dur = 1;                                                           // extend over following ties
          while (tr.cells[(c + dur) % n] && tr.cells[(c + dur) % n].tie && c + dur < cells) dur++;
          const opts = { ...(tr.meta.opts || {}), ...tr.opts, dur: dur * six * 0.92 };
          events.push({ time, run: when => fn(when, gain, cell.freq, opts) });
        } else {
          events.push({ time, run: when => fn(when, gain * cell.vel) });
        }
      }
    }
    events.sort((a, b) => a.time - b.time);
    this.events = events;
  }

  start() {
    if (this.playing || !this.events || !this.events.length) return;
    this.playing = true; this.idx = 0;
    this.songStart = this.loopStart = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this._tick(), 25);
  }

  stop() { this.playing = false; clearInterval(this.timer); }

  bar() {                                                                        // 1-based bar for display
    if (!this.playing) return 0;
    const elapsed = this.ctx.currentTime - this.songStart;
    if (elapsed < 0) return 1;
    return Math.floor(((elapsed / this.six) % (this.bars * 16)) / 16) + 1;
  }

  _tick() {
    const ahead = this.ctx.currentTime + 0.12;
    while (this.playing) {
      if (this.idx >= this.events.length) { this.loopStart += this.songDur; this.idx = 0; }
      const ev = this.events[this.idx];
      const when = this.loopStart + ev.time;
      if (when >= ahead) break;
      ev.run(when); this.idx++;
    }
  }
}
