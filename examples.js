// THUDWORKS — example songs. Each is just code in the song language (see song.js).
// Click one in the app to load it into the editor and play it.

export const EXAMPLES = [
  {
    name: 'Boom Bap',
    code: `
// BOOM BAP — dusty 90bpm head-nod
tempo(90)
swing(14)

play('kick',    rep("x.....x...x.....", 8))
play('snare',   rep("....x.......x...", 8))
play('hat',     rep("x.x.x.x.x.x.x.x.", 8))
play('openhat', rep("..........x.....", 8))
play('bass',    rep("C2 . . . . . . . G1 . . . . . . .", 8))

// a little Rhodes-ish riff floating on top
play('pluck',   rep("E4 . G4 . A4 . G4 E4 D4 . . . . . . .", 4), { gain: 0.4 })
`,
  },
  {
    name: 'Acid House',
    code: `
// ACID HOUSE — 128bpm squelch. '-' holds a note so the 303 slides.
tempo(128)

play('kick',    rep("x...x...x...x...", 16))
play('clap',    rep("....x.......x...", 16))
play('openhat', rep("..x...x...x...x.", 16))

play('synth',   rep("A1 . A2 - C2 . A1 . E2 - A1 . C2 . D2 .", 8),
                { wave: 'sawtooth', cutoff: 1200, detune: 6, gain: 0.5 })
`,
  },
  {
    name: 'Trap',
    code: `
// TRAP — 140, rolling hats and a sliding 808
tempo(140)

play('kick',    rep("x.....x.....x...", 8))
play('snare',   rep("........x.......", 8))
play('hat',     rep("xxxxx.xxxxx.xx.x", 8))
play('openhat', rep("..........x.....", 8))
play('bass',    rep("C1 . . . . . . . C1 . D#1 . F1 . . .", 8))

// sustained minor chords underneath ('+' stacks notes, '-' holds)
play('pad',     rep("C3+D#3+G3 - - - - - - - G#2+C3+D#3 - - - A#2+D3+F3 - - -", 8), { gain: 0.26 })
`,
  },
  {
    name: 'Lo-Fi',
    code: `
// LO-FI — 78bpm, sleepy and swung
tempo(78)
swing(18)

play('kick',  rep("x.......x.....x.", 4))
play('snare', rep("....x.......x...", 4))
play('hat',   rep("..x...x...x...x.", 4))
play('bass',  rep("E2 . . . . . . . C2 . . . D2 . . .", 4))

play('pluck', rep("E4 . G4 B4 . A4 . G4 E4 . D4 . . . . .", 4),
              { wave: 'triangle', cutoff: 2200, gain: 0.4 })
`,
  },
  {
    name: 'Euclid Techno',
    code: `
// EUCLID TECHNO — euclid(hits, steps) spreads hits evenly. Generative drums.
tempo(130)

play('kick',    rep("x...x...x...x...", 16))
play('openhat', rep(euclid(7, 16), 16))
play('clap',    rep(euclid(2, 16, 4), 16))
play('bass',    rep("A1 . . . A1 . . . C2 . . . E2 . . .", 16),
                { wave: 'sawtooth', cutoff: 900, detune: 4 })

play('lead',    rep("A3 . . E4 . . C4 . . E4 . . D4 . . .", 8), { gain: 0.3 })
`,
  },
  {
    name: 'Deep House',
    code: `
// DEEP HOUSE — 122bpm chord stabs. Stack notes with '+' to make a chord.
tempo(122)

play('kick',    rep("x...x...x...x...", 16))
play('clap',    rep("....x.......x...", 16))
play('openhat', rep("..x...x...x...x.", 16))
play('bass',    rep("F1 . . . F1 . . . A#1 . . . C2 . . .", 16))

// Fmaj -> Ebmaj stabs on the off-beat
play('pad',     rep(". . F3+A3+C4 . . . . . D#3+G3+A#3 . . . . . . .", 8),
                { wave: 'sawtooth', cutoff: 1700, detune: 10, gain: 0.3 })
`,
  },
];
