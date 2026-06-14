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
| `gen-808-kit.py` | synthesizes the 808 one-shot kit (pure stdlib) |
| `gen-synth-melodic.py` | synthesizes the melodic synth kit |
| `fetch-acoustic-kit-01.sh` / `fetch-melodic-kit.sh` | build the CC0 sampled kits from VCSL |
| `starter-pack.md` | CC0 sourcing manifest + provenance for the optional sampled kits |
| `name-decision.md` | naming/branding record |
| `sessions/` | development session notes |
| `assets/` | sampled kits (**gitignored** — regenerate via the scripts above) |

## Sounds: synthesized, not sampled

The app generates all audio at runtime, so it ships with no samples and nothing to
license. The optional CC0 sampled kits (acoustic / melodic from VCSL, plus synthesized
808 and synth-melodic kits) live under `assets/`, which is gitignored — they're large
binaries that any of the bundled scripts can regenerate. `starter-pack.md` holds the
full provenance and licensing record.
