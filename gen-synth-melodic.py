#!/usr/bin/env python3
"""THUDWORKS — synthesized melodic set (pure stdlib). Same notes as the VCSL melodic
kit (C4 D4 E4 F#4 G#4 A#4 C5) so you can A/B sampled vs synth on the same pitches.

Timbres: saw (analog lead), square (chiptune), pluck (Karplus-Strong string), bell (FM).
Output audio is synthesized/original — PUBLIC DOMAIN, nothing to license.

Run:    python3 07_projects/thudworks/gen-synth-melodic.py
Output: 07_projects/thudworks/assets/thudworks-kit-melodic-synth/  (28 one-shots, mono 44.1k/16-bit)
"""
import math, wave, struct, random, os

SR = 44100
random.seed(12)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "assets", "thudworks-kit-melodic-synth")
# same scale as the VCSL set, equal temperament (A4=440)
NOTES = {"C4": 261.63, "D4": 293.66, "E4": 329.63, "Fs4": 369.99,
         "Gs4": 415.30, "As4": 466.16, "C5": 523.25}

def n(s): return int(s * SR)

def adsr(L, a=0.005, d=0.05, s=0.8, r=0.25):
    na, nd, nr = n(a), n(d), n(r); ns = max(0, L - na - nd - nr); env = []
    for i in range(na): env.append(i / na if na else 1)
    for i in range(nd): env.append(1 + (s - 1) * (i / nd) if nd else s)
    env += [s] * ns
    for i in range(nr): env.append(s * (1 - i / nr) if nr else 0)
    return (env + [0] * L)[:L]

def finish(buf, peak=0.9):
    m = max((abs(x) for x in buf), default=1) or 1; g = peak / m
    fo = n(0.005)
    return [buf[i] * g * (1 if i < len(buf) - fo else max(0, (len(buf) - i) / fo)) for i in range(len(buf))]

def write(name, buf):
    buf = finish(buf)
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))

def additive(freq, dur, odd_only=False):
    L = n(dur); env = adsr(L); buf = [0.0] * L
    kmax = max(1, int((SR / 2) / freq)); kmax = min(kmax, 30)
    for k in range(1, kmax + 1):
        if odd_only and k % 2 == 0: continue
        w = 2 * math.pi * k * freq / SR
        for i in range(L): buf[i] += (1.0 / k) * math.sin(w * i)
    return [buf[i] * env[i] for i in range(L)]

def pluck(freq, dur=1.2, decay=0.996):  # Karplus-Strong
    L = n(dur); N = max(2, int(SR / freq))
    buf = [random.uniform(-1, 1) for _ in range(N)]; out = [0.0] * L
    for i in range(L):
        out[i] = buf[i % N]
        buf[i % N] = decay * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return out

def bell(freq, dur=2.0, ratio=1.41, I0=6.0, mod_tau=0.4, amp_tau=0.9):  # FM
    L = n(dur); out = [0.0] * L; fm = freq * ratio
    for i in range(L):
        t = i / SR; I = I0 * math.exp(-t / mod_tau)
        out[i] = math.sin(2 * math.pi * freq * t + I * math.sin(2 * math.pi * fm * t)) * math.exp(-t / amp_tau)
    return out

os.makedirs(OUT, exist_ok=True)
for name, f in NOTES.items():
    write("saw_%s.wav"    % name, additive(f, 1.4))
    write("square_%s.wav" % name, additive(f, 1.4, odd_only=True))
    write("pluck_%s.wav"  % name, pluck(f))
    write("bell_%s.wav"   % name, bell(f))

with open(os.path.join(OUT, "CREDITS.txt"), "w") as fp:
    fp.write("THUDWORKS — Melodic Kit (synthesized)\n=====================================\n"
             "License: PUBLIC DOMAIN — synthesized from scratch (gen-synth-melodic.py).\n"
             "Timbres: saw, square, pluck (Karplus-Strong), bell (FM). Notes match the\n"
             "VCSL melodic kit (C4 D4 E4 F#4 G#4 A#4 C5) for direct A/B comparison.\n")
print("Done ->", OUT, "(%d files)" % len(os.listdir(OUT)))
