#!/usr/bin/env bash
# THUDWORKS — melodic sample kit from VCSL (CC0 / public domain).
# Piano = matched A/B scale (C4 D4 E4 F#4 G#4 A#4 C5); marimba + harp = bonus timbres.
# Source: https://github.com/sgossner/VCSL  (LICENSE: CC0)
# Usage:  bash 07_projects/thudworks/fetch-melodic-kit.sh
# Output: ./assets/thudworks-kit-melodic-vcsl/  (gitignored)
set -euo pipefail
cd "$(dirname "$0")/assets"
if [ ! -d VCSL ]; then
  git clone --filter=blob:none --no-checkout --depth 1 https://github.com/sgossner/VCSL.git
fi
cd VCSL
git sparse-checkout init --cone
git sparse-checkout set \
  "Chordophones/Zithers/Grand Piano, Steinway B" \
  "Idiophones/Struck Idiophones/Marimba" \
  "Chordophones/Composite Chordophones/Concert Harp"
git checkout HEAD

P="Chordophones/Zithers/Grand Piano, Steinway B/Sus"
M="Idiophones/Struck Idiophones/Marimba"
H="Chordophones/Composite Chordophones/Concert Harp"
KIT="../thudworks-kit-melodic-vcsl"; rm -rf "$KIT"; mkdir -p "$KIT"
c(){ if [ -f "$1" ]; then command cp "$1" "$KIT/$2"; else echo "MISSING: $1"; fi; }

# Piano — the matched scale
for nt in C4 D4 E4 "F#4" "G#4" "A#4" C5; do
  c "$P/JHPiano_Sus_Close_${nt}_vl3_rr1.wav" "piano_${nt/\#/s}.wav"
done
# Marimba — bonus mallet timbre
for nt in C4 G4 B4; do c "$M/Marimba_hit_Outrigger_${nt}_med_01.wav" "marimba_${nt}.wav"; done
# Harp — bonus plucked-string timbre
for nt in D4 F4 A4 C5; do c "$H/KSHarp_${nt}_mf1.wav" "harp_${nt}.wav"; done

# Trim to one-shot length (VCSL source notes run 25-30s; unusable/huge as clickable
# one-shots) — truncate with a release fade. Real VCSL audio, just shortened.
python3 - "$KIT" <<'PY'
import wave, struct, sys, os
KIT = sys.argv[1]
LIMIT = {"piano": 4.0, "harp": 4.0, "marimba": 2.5}
for f in os.listdir(KIT):
    if not f.endswith(".wav"): continue
    cap = next((v for k, v in LIMIT.items() if f.startswith(k)), 4.0)
    p = os.path.join(KIT, f)
    w = wave.open(p, "rb"); ch, sw, sr, nfr = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
    keep = min(nfr, int(cap * sr)); raw = w.readframes(keep); w.close()
    # decode to int16-range samples (handle 24-bit source)
    def rd(b, i):
        o = i * sw
        if sw == 3:
            v = b[o] | b[o+1] << 8 | b[o+2] << 16
            v = v - (1 << 24) if v & 0x800000 else v
            return v >> 8  # 24 -> 16 bit
        return struct.unpack_from("<h", b, o)[0]
    samples = [rd(raw, i) for i in range(keep * ch)]
    pk = max((abs(s) for s in samples), default=1) or 1
    norm = (0.9 * 32767) / pk  # peak-normalize so quiet instruments are audible
    fade = int(0.3 * sr); out = bytearray()
    for fr in range(keep):
        g = norm * (1.0 if fr < keep - fade else max(0.0, (keep - fr) / fade))
        for cc in range(ch):
            s = int(samples[fr * ch + cc] * g)
            out += struct.pack("<h", max(-32768, min(32767, s)))
    nw = wave.open(p, "wb"); nw.setnchannels(ch); nw.setsampwidth(2); nw.setframerate(sr)
    nw.writeframes(bytes(out)); nw.close()
print("trimmed melodic one-shots")
PY

cat > "$KIT/CREDITS.txt" <<'EOF'
THUDWORKS — Melodic Kit (VCSL, sampled)
=======================================
License: CC0 1.0 (Public Domain) — bundle/redistribute freely, no attribution.
Source:  Versilian Community Sample Library (VCSL), https://github.com/sgossner/VCSL
Piano (Steinway B), Marimba, Concert Harp. Piano = full C4..C5 whole-tone scale for
A/B comparison against the synth set; marimba + harp added as timbre flavor.
EOF
echo "Done -> $KIT ($(ls "$KIT" | wc -l) files)"
