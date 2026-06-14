# THUDWORKS — CC0 Starter Pack (sourcing manifest)

#LLM-generated
**Filed by:** Cloud · **Date:** 2026-06-14 · **Project:** THUDWORKS web beat-DAW
**Rule:** factory palette = **CC0 only** (see `02_reference/2026-06-14-redistributable-sounds-for-thudworks.md`).
**Note:** actual audio files live in `07_projects/thudworks/assets/` which is **gitignored** — this manifest
(links + provenance) is the part that's tracked. Download targets go in `assets/`.

---

## Confirmed-CC0 sources (verified 2026-06-14)

| Source | License | Best for | Link |
|---|---|---|---|
| **VCSL** (Versilian Community Sample Library) | ✅ CC0 (verified) | drums, percussion, **melodic** (keys, mallets, bells, TX81Z synth), strings, winds | https://github.com/sgossner/VCSL — SFZ release: https://github.com/sgossner/VCSL/releases |
| **VSCO 2: Community Edition** | ✅ CC0 (verified) | orchestral/melodic layers | https://versilian-studios.com/vsco-community/ |
| **Producer Space** (18 packs, 2000+) | CC0 (advertised, verify per-pack readme) | drums, 808s, vocals, MIDI | https://producerspace.com/ |
| **Erokia** (Freesound author) | CC0 (author-tagged) | electronic textures, FX, ambient, misc loops | https://freesound.org/people/Erokia/ — packs e.g. Electronic Samples Misc (CC0) https://freesound.org/people/Erokia/packs/26717/ |
| **Freesound — CC0 filter** | CC0 (verify each) | everything, per-element search | Browse: https://freesound.org/browse/tags/cc0/ — or search a term, then sidebar **Licenses → Creative Commons 0** |

**Freesound how-to:** search the element (e.g. `kick`), then in the left sidebar set the **Licenses**
facet to **Creative Commons 0**. Only download sounds whose license badge reads **CC0** — ignore the
description if it asks for credit (CC0 wins, but skip anything that looks mis-tagged for hero sounds).

---

## Per-element shopping list (a basic beat kit)

Target ~6 starter banks. Check each off as the WAV lands in `assets/`.

- [ ] **Kick** — Producer Space 808/drum packs · Freesound CC0 `kick` / `bass drum`
- [ ] **Snare / Clap** — Producer Space · Freesound CC0 `snare`, `clap`
- [ ] **Hi-hats (closed/open)** — Freesound CC0 `hihat`, `hi-hat`, `cymbal` · VCSL idiophones
- [ ] **808 / sub bass** — Producer Space "808 Drums" pack · Freesound CC0 `808`, `sub bass`
- [ ] **Percussion (toms, shakers, rims)** — VCSL membranophones/idiophones · Freesound CC0 `percussion`
- [ ] **Melodic one-shots (keys, plucks, bells, pads)** — VCSL + VSCO CE (SFZ → render one-shots) · Erokia electronic
- [ ] **FX / textures (risers, vinyl crackle, foley)** — Erokia CC0 packs · Freesound CC0 `texture`, `vinyl`

> Melodic note: VCSL/VSCO ship as **SFZ** (multi-sample instruments). For a simple web DAW you'll likely
> render/export a few single notes per instrument as one-shot WAVs rather than wiring a full SFZ player.

---

## Provenance manifest

CC0 doesn't legally require this, but keeping it makes the licensing auditable.

### Kit 01 — "Acoustic Beat Kit" ✅ BUILT (2026-06-14)
- **22 one-shots**, all **CC0**, all from **VCSL** (https://github.com/sgossner/VCSL).
- Reproduce locally: `bash 07_projects/thudworks/fetch-acoustic-kit-01.sh` → `assets/thudworks-kit-acoustic-01/`
  (audio is gitignored; the script + this manifest are the tracked record).
- Delivered to Operator as `thudworks-kit-acoustic-01.zip` (2.5 MB) on 2026-06-14.

| Files | Element | Source | License |
|---|---|---|---|
| kick_soft / kick_mid / kick_hard | kick (3 velocities) | VCSL · Bass Drum 1 | CC0 |
| snare_soft / snare_mid / snare_hard / snare_nosnare | snare | VCSL · Snare Drum Modern 1 | CC0 |
| hat_closed / hat_loose / hat_open | hi-hat | VCSL · Hi-Hat Cymbal | CC0 |
| clap / clap_group | clap | VCSL · Claps | CC0 |
| tom_1 / tom_2 | tom | VCSL · Tom 1 | CC0 |
| conga_open / conga_slap | conga | VCSL · Conga | CC0 |
| woodblock | woodblock | VCSL · Woodblock | CC0 |
| shaker | shaker | VCSL · Shaker, Small | CC0 |
| cowbell / cowbell_muted | cowbell | VCSL · Cowbells | CC0 |
| tambourine / tambourine_shake | tambourine | VCSL · Tambourine 1 | CC0 |

### Kit 03 — "Melodic (sampled)" ✅ BUILT (2026-06-14)
- **14 one-shots, CC0** from VCSL. Notes: **C4 D4 E4 F#4 G#4 A#4 C5** (piano = full scale)
  + marimba (C4/G4/B4) + harp (D4/F4/A4/C5) as timbre flavor.
- Build: `bash 07_projects/thudworks/fetch-melodic-kit.sh` → `assets/thudworks-kit-melodic-vcsl/`.
  Source piano notes run 25–30s; the script **trims to 4s one-shots + peak-normalizes** (so the quiet
  marimba/harp are audible). Delivered as `thudworks-kit-melodic-vcsl.zip` (5.8 MB).
- Instruments: Grand Piano (Steinway B), Marimba, Concert Harp — all **CC0** (VCSL).

### Kit 04 — "Melodic (synth)" ✅ BUILT (2026-06-14)
- **28 one-shots, PUBLIC DOMAIN** — synthesized, **same 7 notes** as Kit 03 for direct A/B.
- Generate: `python3 07_projects/thudworks/gen-synth-melodic.py` → `assets/thudworks-kit-melodic-synth/`.
- 4 timbres × 7 notes: **saw** (analog lead), **square** (chiptune), **pluck** (Karplus-Strong string),
  **bell** (FM). Delivered as `thudworks-kit-melodic-synth.zip` (3.3 MB).
- A/B: `piano_C4` (sampled) vs `saw_C4` / `bell_C4` (synth) — same pitch, sampled vs generated.

### Kit 02 — "808 Kit" ✅ BUILT (2026-06-14)
- **19 one-shots, PUBLIC DOMAIN** — *synthesized from scratch* (no third-party samples at all),
  so even cleaner than CC0: nothing to attribute, nothing to license.
- Generate locally: `python3 07_projects/thudworks/gen-808-kit.py` (pure stdlib, no deps) →
  `assets/thudworks-kit-808-01/`. Deterministic (seed 808); every voice is a tweakable function.
- Delivered to Operator as `thudworks-kit-808-01.zip` (893 KB) on 2026-06-14.

| Files | Element | Method | License |
|---|---|---|---|
| kick_808 / kick_808_punch | 808 kick | sine + pitch-env + click | Public domain (synth) |
| bass_808_C / Ds / F / G / As | tuned 808 bass | saturated sine, long decay | Public domain (synth) |
| snare / snare_soft | snare | dual-tone + HP noise | Public domain (synth) |
| hat_closed / hat_open | hi-hat | HP noise + decay | Public domain (synth) |
| clap | clap | burst train + tail | Public domain (synth) |
| cowbell | cowbell | dual square 540/800 Hz | Public domain (synth) |
| clave / rim | perc | short sine blip | Public domain (synth) |
| tom_low / tom_mid / tom_hi | toms | sine + pitch-env | Public domain (synth) |
| shaker | shaker | HP noise burst | Public domain (synth) |

---

## Not verified / excluded
- **deadrobotmusic – Drum One Shots (Snares)** — couldn't confirm license (Freesound 403'd the fetch).
  Verify the CC0 badge in-browser before using; otherwise skip.
- Anything from **Sonniss / SampleRadar / Cymatics / Looperman** — use-in-track only, **do not bundle**
  (per the research note). Let users *import their own* of these instead.

---

*Next executable step if wanted: a download pass that fills `assets/` from the CC0 sources above and
completes the provenance table. (Large binaries stay local/gitignored.)*
