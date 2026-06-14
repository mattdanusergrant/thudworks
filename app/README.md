# THUDWORKS — web beat machine

#LLM-generated

A browser-based step sequencer / beat lab. **Every sound is synthesized live with the
Web Audio API** (the TR-808 is analog synthesis, so we generate it the same way) — there
are **no audio files**, nothing to host, and nothing to license. The app *is* the kit.

## Run it
No build step, no dependencies. It uses ES modules, so serve over http (not `file://`):

```bash
cd 07_projects/thudworks/app
python3 -m http.server 8000
# open http://localhost:8000
```

## Features
- **9 tracks** — Kick, 808 Bass, Snare, Clap, Hat, Open Hat, Cowbell, Clave, Tom
- **16-step** grid, beat-grouped; tap a cell to program a step (it auditions on click)
- **Transport** — Play/Stop with a lookahead scheduler (sample-tight timing), BPM, Swing, master Volume
- **808 Bass** follows a selectable root note (C1–B3)
- **Presets** — Boom Bap, Trap, House, Funk (load instantly with the right tempo)
- **Clear / Random**, per-track **mute** (click a track name)
- Mobile-friendly layout

## Files
| File | Role |
|---|---|
| `index.html` | markup + controls |
| `style.css` | dark/neon theme |
| `synth.js` | Web Audio voices (ported from `../gen-808-kit.py`) + `noteFreq` |
| `sequencer.js` | lookahead-scheduler transport |
| `app.js` | grid build, control wiring, visual playhead |

## Why synthesized (not sampled)
See `../starter-pack.md` and `../../../02_reference/2026-06-14-redistributable-sounds-for-thudworks.md`:
a DAW that ships sounds is *redistributing a sample library*, which most "free" packs forbid.
Synthesis sidesteps the whole question — generated audio is original/public-domain, the cleanest
license tier there is, and it loads instantly. Sampled kits (VCSL/CC0) can be layered in later as
an optional "premium" bank.

## Not yet
- Sampled-kit loader (the CC0 acoustic/melodic kits as an optional bank)
- Per-step bass pitch + a melodic/lead lane
- Pattern save/share (URL or localStorage), song-mode (chaining patterns)
- Not yet browser-verified in this environment (no headless browser) — needs a real-device eyeball.
