#!/usr/bin/env bash
# THUDWORKS — reproduce "Acoustic Beat Kit 01" from VCSL (CC0 / public domain).
# Source: https://github.com/sgossner/VCSL  (LICENSE: CC0 — bundle/redistribute freely)
# Output: ./assets/thudworks-kit-acoustic-01/  (22 one-shots) — gitignored, regenerate anytime.
# Usage:  bash 07_projects/thudworks/fetch-acoustic-kit-01.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets && cd assets

# 1. Blobless sparse clone — only the folders we need, ~84MB instead of the full library.
if [ ! -d VCSL ]; then
  git clone --filter=blob:none --no-checkout --depth 1 https://github.com/sgossner/VCSL.git
fi
cd VCSL
git sparse-checkout init --cone
git sparse-checkout set \
  "Membranophones/Struck Membranophones/Bass Drum 1" \
  "Membranophones/Struck Membranophones/Snare Drum, Modern 1" \
  "Membranophones/Struck Membranophones/Tom 1" \
  "Membranophones/Struck Membranophones/Conga" \
  "Idiophones/Struck Idiophones/Hi-Hat Cymbal" \
  "Idiophones/Struck Idiophones/Claps" \
  "Idiophones/Struck Idiophones/Woodblock" \
  "Idiophones/Struck Idiophones/Shaker, Small" \
  "Idiophones/Struck Idiophones/Cowbells" \
  "Idiophones/Struck Idiophones/Tambourine 1"
git checkout HEAD

# 2. Curate selected one-shots into a clean, friendly-named kit.
M="Membranophones/Struck Membranophones"; I="Idiophones/Struck Idiophones"
KIT="../thudworks-kit-acoustic-01"; rm -rf "$KIT"; mkdir -p "$KIT"
cp(){ command cp "$@"; }
c(){ if [ -f "$1" ]; then command cp "$1" "$KIT/$2"; else echo "MISSING: $1"; fi; }
c "$M/Bass Drum 1/BDrumNew_hit_v2_rr1_Sum.wav"      kick_soft.wav
c "$M/Bass Drum 1/BDrumNew_hit_v5_rr1_Sum.wav"      kick_mid.wav
c "$M/Bass Drum 1/BDrumNew_hit_v7_rr1_Sum.wav"      kick_hard.wav
c "$M/Snare Drum, Modern 1/Snare2_HitSN_v3_rr1_Mid.wav" snare_soft.wav
c "$M/Snare Drum, Modern 1/Snare2_HitSN_v6_rr1_Mid.wav" snare_mid.wav
c "$M/Snare Drum, Modern 1/Snare2_HitSN_v9_rr1_Mid.wav" snare_hard.wav
c "$M/Snare Drum, Modern 1/Snare2_HitNS_v6_rr1_Mid.wav" snare_nosnare.wav
c "$I/Hi-Hat Cymbal/HiHat_Close_rr1_Mid.wav"        hat_closed.wav
c "$I/Hi-Hat Cymbal/HiHat_HitLoose_rr1_Mid.wav"     hat_loose.wav
c "$I/Hi-Hat Cymbal/HiHat_HitO_rr1_Mid.wav"         hat_open.wav
c "$I/Claps/SoloClap_vl3.wav"                       clap.wav
c "$I/Claps/Clap_rr1.wav"                           clap_group.wav
c "$M/Conga/Conga_HitN_v2_rr1_Sum.wav"              conga_open.wav
c "$M/Conga/Conga_HitFM_v2_rr1_Sum.wav"             conga_slap.wav
c "$I/Woodblock/wood_click_f_rr1.wav"               woodblock.wav
c "$I/Shaker, Small/Mid_ShakerDouble_Down_rr1.wav"  shaker.wav
c "$I/Cowbells/Cowbell1_Normal_v3_rr1_Mid.wav"      cowbell.wav
c "$I/Cowbells/Cowbell1_Muted_v3_rr1_Mid.wav"       cowbell_muted.wav
c "$I/Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav"        tambourine.wav
c "$I/Tambourine 1/Tamb1_Shake_rr1_Mid.wav"         tambourine_shake.wav
n=0; for f in "$M/Tom 1/Stick/"*.wav; do [ -f "$f" ] || continue; n=$((n+1)); command cp "$f" "$KIT/tom_$n.wav"; [ $n -ge 2 ] && break; done

echo "Done -> $KIT ($(ls "$KIT" | wc -l) files)"
