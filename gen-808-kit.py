#!/usr/bin/env python3
"""THUDWORKS — 808-style drum kit synthesizer (pure stdlib, no deps).

The Roland TR-808 is analog *synthesis*, not samples — so this generates the kit
from math: sine + noise + envelopes. Output audio is original/synthesized work
with NO license encumbrance (public domain by nature), safe to bundle and sell.

Run:    python3 07_projects/thudworks/gen-808-kit.py
Output: 07_projects/thudworks/assets/thudworks-kit-808-01/  (~19 one-shots, mono 44.1k/16-bit)
Tweak:  every sound is a function below — change a freq/decay and re-run.
"""
import math, wave, struct, random, os

SR = 44100
random.seed(808)  # reproducible noise
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "assets", "thudworks-kit-808-01")

# ---- helpers ---------------------------------------------------------------
def n(secs): return int(secs * SR)

def exp_env(buf_len, tau):
    return [math.exp(-i / SR / tau) for i in range(buf_len)]

def hp1(x, cut):  # one-pole high-pass
    rc = 1.0 / (2 * math.pi * cut); a = rc / (rc + 1.0 / SR)
    y = [0.0] * len(x); prev_x = prev_y = 0.0
    for i, s in enumerate(x):
        prev_y = a * (prev_y + s - prev_x); prev_x = s; y[i] = prev_y
    return y

def lp1(x, cut):  # one-pole low-pass
    rc = 1.0 / (2 * math.pi * cut); a = (1.0 / SR) / (rc + 1.0 / SR)
    y = [0.0] * len(x); prev = 0.0
    for i, s in enumerate(x):
        prev = prev + a * (s - prev); y[i] = prev
    return y

def hp(x, cut, times=3):
    for _ in range(times): x = hp1(x, cut)
    return x

def noise(buf_len): return [random.uniform(-1, 1) for _ in range(buf_len)]

def finish(buf, peak=0.9, fade_in=0.002, fade_out=0.01):
    m = max((abs(s) for s in buf), default=1.0) or 1.0
    g = peak / m
    fi, fo = n(fade_in), n(fade_out); L = len(buf)
    out = []
    for i, s in enumerate(buf):
        s *= g
        if i < fi: s *= i / fi
        if i > L - fo: s *= max(0.0, (L - i) / fo)
        out.append(s)
    return out

def write(name, buf):
    buf = finish(buf)
    with wave.open(os.path.join(OUT, name), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))

NOTES = {"C": 32.70, "D#": 38.89, "F": 43.65, "G": 49.00, "A#": 58.27}  # octave 1

# ---- voices ----------------------------------------------------------------
def kick(f_start=110, f_end=46, p_tau=0.03, a_tau=0.45, dur=1.1, click=0.6):
    L = n(dur); aenv = exp_env(L, a_tau); buf = [0.0] * L; ph = 0.0
    for i in range(L):
        f = f_end + (f_start - f_end) * math.exp(-i / SR / p_tau)
        ph += 2 * math.pi * f / SR
        buf[i] = math.tanh(1.6 * math.sin(ph)) * aenv[i]
    cl = n(0.006)  # transient click
    for i in range(cl): buf[i] += click * (1 - i / cl) * random.uniform(-1, 1)
    return buf

def bass(freq, dur=1.3, a_tau=0.55):
    L = n(dur); aenv = exp_env(L, a_tau); buf = [0.0] * L; ph = 0.0
    for i in range(L):
        f = freq * (1 + 0.6 * math.exp(-i / SR / 0.02))  # tiny attack pitch drop
        ph += 2 * math.pi * f / SR
        buf[i] = math.tanh(1.8 * math.sin(ph)) * aenv[i]  # saturation -> audible harmonics
    return buf

def snare(noise_amt=0.7, tone_tau=0.10, n_tau=0.18, dur=0.3):
    L = n(dur); buf = [0.0] * L
    te = exp_env(L, tone_tau); ph1 = ph2 = 0.0
    for i in range(L):
        ph1 += 2 * math.pi * 180 / SR; ph2 += 2 * math.pi * 330 / SR
        buf[i] = 0.5 * (math.sin(ph1) + 0.7 * math.sin(ph2)) * te[i] * (1 - noise_amt)
    ne = exp_env(L, n_tau); nz = hp(noise(L), 1200, 2)
    for i in range(L): buf[i] += nz[i] * ne[i] * noise_amt
    return buf

def hat(dur, tau):
    L = n(dur); e = exp_env(L, tau); nz = hp(noise(L), 7000, 4)
    return [nz[i] * e[i] for i in range(L)]

def clap():
    L = n(0.35); buf = [0.0] * L; nz = hp(noise(L), 1000, 3)
    for off in (0.0, 0.010, 0.020, 0.030):  # 3 quick bursts + tail
        s = n(off); e = exp_env(L - s, 0.012)
        for i in range(len(e)): buf[s + i] += nz[s + i] * e[i]
    te = exp_env(L, 0.10)  # spread tail
    for i in range(L): buf[i] += nz[i] * te[i] * 0.4
    return buf

def cowbell():  # two detuned pulse-ish oscillators, classic 808
    L = n(0.4); e = exp_env(L, 0.18); buf = [0.0] * L; p1 = p2 = 0.0
    for i in range(L):
        p1 += 2 * math.pi * 540 / SR; p2 += 2 * math.pi * 800 / SR
        sq = (1 if math.sin(p1) > 0 else -1) + (1 if math.sin(p2) > 0 else -1)
        buf[i] = sq * e[i]
    return lp(buf, 4000)

def lp(x, cut, times=2):
    for _ in range(times): x = lp1(x, cut)
    return x

def blip(freq, dur, tau):  # clave / rim
    L = n(dur); e = exp_env(L, tau); buf = [0.0] * L; ph = 0.0
    for i in range(L):
        ph += 2 * math.pi * freq / SR; buf[i] = math.sin(ph) * e[i]
    return buf

def tom(freq, dur=0.4, p_tau=0.04, a_tau=0.16):
    L = n(dur); aenv = exp_env(L, a_tau); buf = [0.0] * L; ph = 0.0
    for i in range(L):
        f = freq * (1 + 0.5 * math.exp(-i / SR / p_tau))
        ph += 2 * math.pi * f / SR; buf[i] = math.sin(ph) * aenv[i]
    return buf

def shaker():
    L = n(0.12); e = exp_env(L, 0.03); nz = hp(noise(L), 6000, 3)
    return [nz[i] * e[i] for i in range(L)]

# ---- render ----------------------------------------------------------------
os.makedirs(OUT, exist_ok=True)
write("kick_808.wav",       kick())
write("kick_808_punch.wav", kick(f_start=140, f_end=52, a_tau=0.22, dur=0.6))
for name, f in NOTES.items():
    write("bass_808_%s.wav" % name.replace("#", "s"), bass(f))
write("snare.wav",      snare())
write("snare_soft.wav", snare(noise_amt=0.5, dur=0.22))
write("hat_closed.wav", hat(0.06, 0.012))
write("hat_open.wav",   hat(0.45, 0.13))
write("clap.wav",       clap())
write("cowbell.wav",    cowbell())
write("clave.wav",      blip(1180, 0.07, 0.012))
write("rim.wav",        blip(420, 0.06, 0.010))
write("tom_low.wav",    tom(90))
write("tom_mid.wav",    tom(140))
write("tom_hi.wav",     tom(200))
write("shaker.wav",     shaker())

# credits
with open(os.path.join(OUT, "CREDITS.txt"), "w") as fp:
    fp.write("THUDWORKS — 808 Kit 01\n======================\n"
             "License: PUBLIC DOMAIN — synthesized from scratch (gen-808-kit.py), no\n"
             "         third-party samples, no attribution, free to bundle/sell.\n"
             "Generated: synthesized, deterministic (seed 808). Re-run the script to tweak.\n")
print("Done ->", OUT, "(%d files)" % len(os.listdir(OUT)))
