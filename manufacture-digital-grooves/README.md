# Manufacture Digital Grooves

**A tool for mattdanusergrant.com.** Write a whole song — drums, bass, melodies, chords —
as code, and it plays back. Every sound is synthesized live with the Web Audio API: no audio
files to host or license.

> Staged here in the `thudworks` repo for hand-off. **Move this folder's contents into the
> mattdanusergrant.com site** (see *Integrating into the site* below). It does not belong to
> ThudWorks long-term — ThudWorks is the classic step sequencer; this is the coding-music tool.

## What's here

| File | What |
|---|---|
| `index.html` / `style.css` | the editor app + dark/neon theme |
| `synth.js` | Web Audio voices — drums, 808, melodic synth, NES pulse/triangle |
| `song.js` | the song language (compiler + pattern parser) and lookahead player |
| `examples.js` | built-in example songs, grouped by genre (VGM, EDM, Hip-Hop) |
| `app.js` | editor, transport, WAV export, example wiring |
| `crafter.html` / `crafter.js` | Code Crafter — button-driven song builder that emits code |
| `build-standalone.py` | bundles everything into one file |
| `grooves-standalone.html` | single-file build (everything inlined; double-clickable) |

## The song language (quick reference)

```js
tempo(120); swing(8)
play('kick',  rep("x...x...x...x...", 8))     // drums: x = hit, . = rest
play('bass',  rep("C2 . . . G1 . . .", 8))    // pitched: notes, . rest, - tie, + chord
section('verse', { kick: "x...x...x...x...", bass: "C2 . . . . . . ." })
arrange('intro', 'verse', 'verse', 'chorus')  // structure the whole song
```

- **Instruments:** kick, snare, clap, hat, openhat, cowbell, clave, tom · pitched: bass (808),
  synth, lead, pad, pluck · **NES:** `pulse` & `pulse2` (square channels), `tri` (triangle bass).
- **Helpers:** `rep`, `seq`, `euclid`, `length`, `transpose`. **opts:** `{ gain, swing, wave, cutoff, detune }`.
- **Code Crafter** builds a loop with buttons and hands the code to the editor.
- **Generate WAV** renders the song offline (no upload) to a lossless `.wav`.

Full docs live in the in-app "How the code works" panel.

## Run it locally

ES modules need to be served over http (not `file://`):

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Or just open `grooves-standalone.html` directly — it's the whole tool inlined into one file.

## Integrating into the site (mattdanusergrant.com)

This tool is plain static files (HTML/CSS/ES-modules).

1. Copy this folder into the mattdanusergrant.com site repo as a subdirectory, e.g. `grooves/`.
2. Add a link/card to it from the site index/nav: `<a href="grooves/">Manufacture Digital Grooves</a>`.
3. GitHub Pages serves it as-is (ES modules work over https). No build step, no dependencies.
   If the site uses Jekyll, a top-level `.nojekyll` is the usual safeguard, though none of these
   filenames start with `_`, so it should serve fine either way.
4. Rebuild the single-file bundle after edits with `python3 build-standalone.py`.

The handoff between the editor and the Code Crafter uses `localStorage['mdg:craft']`, so it
won't collide with other tools on the site.
