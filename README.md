# ThudWorks

### make dope grooves.

A browser-based step sequencer / beat lab. **Every sound is synthesized live with the
Web Audio API** — there are no audio files to host or license. The app *is* the kit.

## Run it

**Live:** https://mattdanusergrant.github.io/thudworks/

No build step, no dependencies. It uses ES modules, so serve over http (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `thudworks-standalone.html` directly — it's a single-file build with
everything inlined.

## Features

- **9 tracks** — Kick, 808 Bass, Snare, Clap, Hat, Open Hat, Cowbell, Clave, Tom
- **16-step** grid, beat-grouped; tap a cell to program a step (it auditions on click)
- **Transport** — Play/Stop with a lookahead scheduler (sample-tight timing), BPM, Swing, master Volume
- **808 Bass** follows a selectable root note (C1–B3)
- **Presets** — Boom Bap, Trap, House, Funk
- **Clear / Random**, per-track **mute** (click a track name)
- **Formula mode** — type math, it draws the beat (see below)
- Mobile-friendly layout

## Formula mode

A [tixy](https://tixy.land)-style toy, but for rhythm instead of pixels. Type a math
expression in the `ƒ(x,y,t)` box and it fills the grid live as you type. Each cell is
evaluated and **fires when the result is positive (or true)**:

- `x` — step, 0–15 (column)
- `y` — row, 0–8 (0 = top track, Kick)
- `i` — flat index, `y*16 + x`
- `t` — bar counter; advances every bar while playing

`Math` is in scope, so `sin`, `floor`, `PI` etc. work bare. Formulas that reference `t`
**evolve every bar** (generative grooves); ones that don't stay put. A few to try:

| Formula | What you get |
|---|---|
| `(x+y)%4==0` | diagonal cascade across the kit |
| `(x&y)==0` | XOR / Sierpinski sparkle |
| `x%(y+2)==0` | stacked polyrhythm, slower per row |
| `y<2 && x%4==0` | four-on-the-floor on kick + bass only |
| `sin(x/2+t)>0.5` | a wave that drifts every bar |

Editing a formula-owned cell by hand, or hitting Clear / Random / a preset, hands control
back to you and switches formula mode off.

**Lock a row** with the 🔓 button at its left edge: locked rows are left untouched by the
formula. So you can hand-draw a kick, lock it, then run an evolving formula like
`sin(x/2+t)>0.5` and only the *unlocked* rows get generated and re-rolled each bar. Editing
a cell in a locked row tweaks it without turning the formula off.

## Repo layout

| Path | What |
|---|---|
| `index.html` / `style.css` | markup + dark/neon theme |
| `synth.js` | Web Audio voices (ported from `gen-808-kit.py`) |
| `sequencer.js` | lookahead-scheduler transport |
| `app.js` | grid build, control wiring, visual playhead |
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
