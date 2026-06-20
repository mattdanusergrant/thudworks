# ThudWorks

### write a song in code.

A browser-based environment where you **write entire songs as code** — drums, bass,
and melodies — and it plays them back. **Every sound is synthesized live with the Web
Audio API**: there are no audio files to host or license. The app *is* the instrument.

## Run it

**Live:** https://mattdanusergrant.github.io/thudworks/

No build step, no dependencies. It uses ES modules, so serve over http (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `thudworks-standalone.html` directly — it's a single-file build with
everything inlined.

## How it works

You write a song by calling `play(...)` for each part. Hit **Play** and it compiles and
loops. Pick one of the built-in **Songs** to load it into the editor and play instantly.

```js
tempo(90)        // bpm
swing(14)        // 0–70%, delays every other 16th

play('kick',  rep("x.....x...x.....", 8))   // 1-bar pattern, repeated 8×
play('snare', rep("....x.......x...", 8))
play('hat',   rep("x.x.x.x.x.x.x.x.", 8))
play('bass',  rep("C2 . . . . . . . G1 . . . . . . .", 8))
play('pluck', rep("E4 . G4 . A4 . G4 E4 D4 . . . . . . .", 4), { gain: 0.4 })
```

**Patterns** are read one 16th-note per cell, and every part loops to fill the longest
one (so a 1-bar drum loop repeats automatically under a 16-bar melody):

- **Drums** — one character per step: `x` (or any non-`.`) = hit, `.` = rest. Spaces are
  ignored, so you can group beats: `"x... x... x... x..."`
- **Pitched** — whitespace-separated tokens: a note like `C4` / `F#3` / `Bb2` plays it,
  `.` = rest, `-` = hold (tie, so a note sustains across cells).

**Helpers**
- `rep(pattern, n)` — repeat a pattern `n` times (build arrangements by composing strings)
- `euclid(hits, steps[, rotate])` — an evenly-spread drum pattern (Euclidean rhythm)

**opts** (pitched parts): `{ wave, cutoff, detune, gain }` —
e.g. `{ wave: 'square', cutoff: 1200, gain: 0.4 }`.

**Instruments:** `kick`, `snare`, `clap`, `hat`, `openhat`, `cowbell`, `clave`, `tom` ·
pitched: `bass` (808 sub), `synth`, `lead`, `pad`, `pluck`.

**Built-in songs:** Boom Bap · Acid House · Trap · Lo-Fi · Euclid Techno.

## Repo layout

| Path | What |
|---|---|
| `index.html` / `style.css` | markup + dark/neon theme |
| `synth.js` | Web Audio voices — drums, 808, and a melodic synth |
| `song.js` | the song language (compiler + pattern parser) and lookahead player |
| `examples.js` | the built-in example songs |
| `app.js` | editor, transport, and example wiring |
| `thudworks-standalone.html` | single-file build (everything inlined) |
| `gen-808-kit.py` | offline synth render of the 808 one-shot kit (pure stdlib) |
| `gen-synth-melodic.py` | offline synth render of the melodic kit |
| `name-decision.md` | naming/branding record |
| `sessions/` | development session notes |

## Sounds: synthesized, not sampled

Every sound is generated at runtime in `synth.js` with the Web Audio API — the app
ships with **no audio files**, nothing to host, and nothing to license. That's the whole
point: clean licensing, instant load, and it fits the workshop vibe. The `gen-*.py`
scripts are the same synthesis offline (handy for rendering one-shots), but the app needs
nothing from them to run.
