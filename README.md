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
- Mobile-friendly layout

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
