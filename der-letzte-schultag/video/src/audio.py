"""Voices (espeak-ng + MBROLA), synthesized sound effects and music, and the final mix."""
import hashlib
import os
import subprocess
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
CACHE = os.path.join(os.path.dirname(__file__), "..", "build", "tts")
os.makedirs(CACHE, exist_ok=True)
rng = np.random.default_rng(7)

EXTRA_VOICES = {
    "JONAS": ("de2", 52),
    "RADIO": ("de1", 45),
    "DURCHSAGE": ("de2", 34),
    "FUNK": ("de4", 40),
}


def _read_wav(path):
    with wave.open(path) as w:
        sr = w.getframerate()
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
        if w.getnchannels() == 2:
            data = data.reshape(-1, 2).mean(axis=1)
    if sr != SR:
        x_old = np.linspace(0, 1, len(data))
        x_new = np.linspace(0, 1, int(len(data) * SR / sr))
        data = np.interp(x_new, x_old, data).astype(np.float32)
    return data


def tts(text, voice, pitch, speed=150):
    key = hashlib.md5(f"{text}|{voice}|{pitch}|{speed}".encode()).hexdigest()
    path = os.path.join(CACHE, key + ".wav")
    if not os.path.exists(path):
        subprocess.run(["espeak-ng", "-v", f"mb-{voice}", "-p", str(pitch), "-s", str(speed), "-w", path, text],
                       check=True, stderr=subprocess.DEVNULL)
    a = _read_wav(path)
    # trim silence
    idx = np.where(np.abs(a) > 0.01)[0]
    if len(idx):
        a = a[max(0, idx[0] - 400): idx[-1] + 800]
    peak = np.max(np.abs(a)) or 1
    return (a / peak * 0.85).astype(np.float32)


def filt(x, kind, f):
    b, a = butter(2, np.array(f) / (SR / 2), btype=kind)
    return lfilter(b, a, x).astype(np.float32)


def radio(x):
    x = filt(x, "band", [400, 3000])
    x = np.tanh(x * 3) * 0.6
    return x + rng.normal(0, 0.02, len(x)).astype(np.float32)


def env(n, a=0.005, r=0.1):
    e = np.ones(n, np.float32)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr and nr < n:
        e[-nr:] = np.linspace(1, 0, nr)
    return e


def t_(d):
    return np.arange(int(d * SR)) / SR


# ------------------------------------------------------------------ SFX
def sfx(name, d=None):
    if name == "hit":  # bass hit at the end of every episode
        t = t_(2.5)
        f = 70 * np.exp(-t * 1.2) + 28
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
        x += filt(rng.normal(0, 1, len(t)), "low", 300) * np.exp(-t * 6) * 0.6
        return np.tanh(x * 1.6).astype(np.float32) * 0.9
    if name == "whoosh":
        t = t_(0.8)
        x = filt(rng.normal(0, 1, len(t)), "band", [300, 2500]) * np.sin(np.pi * t / 0.8) ** 2
        return x.astype(np.float32) * 0.5
    if name == "alarmclock":
        out = []
        for _ in range(4):
            t = t_(0.12)
            out += [np.sin(2 * np.pi * 2000 * t) * 0.3, np.zeros(int(0.08 * SR))]
            out += [np.sin(2 * np.pi * 2000 * t) * 0.3, np.zeros(int(0.35 * SR))]
        return np.concatenate(out).astype(np.float32)
    if name == "ping":
        t = t_(0.5)
        return ((np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * np.exp(-t * 9) * 0.35).astype(np.float32)
    if name == "buzz":  # phone vibration
        out = []
        for _ in range(2):
            t = t_(0.35)
            out += [np.sign(np.sin(2 * np.pi * 160 * t)) * 0.12 * filt(np.ones(len(t)), "low", 50), np.zeros(int(0.15 * SR))]
        return filt(np.concatenate(out), "low", 900) * 2
    if name == "siren":
        dd = d or 6
        t = t_(dd)
        f = 750 + 180 * np.sin(2 * np.pi * 0.5 * t)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15
        return filt(x, "low", 1800) * env(len(t), 1.5, 1.5)
    if name == "knock":
        t = t_(0.25)
        x = filt(rng.normal(0, 1, len(t)), "low", 400) * np.exp(-t * 30) * 1.4
        x += np.sin(2 * np.pi * 90 * t) * np.exp(-t * 25)
        return x.astype(np.float32)
    if name == "knock3":
        k = sfx("knock")
        gap = np.zeros(int(0.45 * SR), np.float32)
        return np.concatenate([k, gap, k, gap, k])
    if name == "slam":
        t = t_(0.9)
        x = filt(rng.normal(0, 1, len(t)), "low", 500) * np.exp(-t * 12) * 1.5
        x += np.sin(2 * np.pi * 60 * t) * np.exp(-t * 8)
        return np.tanh(x).astype(np.float32)
    if name == "thud":
        t = t_(0.5)
        return (np.sin(2 * np.pi * 55 * t) * np.exp(-t * 12) + filt(rng.normal(0, 1, len(t)), "low", 250) * np.exp(-t * 20)).astype(np.float32)
    if name == "heartbeat":
        t = t_(0.18)
        b = np.sin(2 * np.pi * 50 * t) * np.exp(-t * 25)
        one = np.concatenate([b, np.zeros(int(0.12 * SR)), b * 0.7, np.zeros(int(0.5 * SR))])
        return np.tile(one, int((d or 4) / 0.98) + 1).astype(np.float32) * 0.9
    if name == "growl":
        t = t_(d or 1.5)
        car = filt(rng.normal(0, 1, len(t)), "band", [80, 600])
        mod = 0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) * np.sin(2 * np.pi * 1.3 * t)
        return (car * mod * env(len(t), 0.1, 0.4) * 1.2).astype(np.float32)
    if name == "scream":
        t = t_(d or 1.2)
        f = 520 + 180 * np.sin(2 * np.pi * 6 * t) + 300 * t
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3
        x = filt(x, "band", [700, 3200]) + filt(rng.normal(0, 0.3, len(t)), "band", [1500, 4000])
        return (x * env(len(t), 0.05, 0.5) * 0.8).astype(np.float32)
    if name == "glass":
        t = t_(1.2)
        x = filt(rng.normal(0, 1, len(t)), "high", 2500) * np.exp(-t * 5)
        for f in (2900, 4100, 5300, 6100):
            x += np.sin(2 * np.pi * f * t) * np.exp(-t * (6 + f / 1000)) * 0.15
        return x.astype(np.float32) * 0.7
    if name == "taser":
        t = t_(d or 1.2)
        x = rng.normal(0, 1, len(t)) * (rng.random(len(t)) > 0.7) * (np.sin(2 * np.pi * 60 * t) > 0)
        return filt(x.astype(np.float32), "high", 1500) * 0.5
    if name == "bell":  # school bell
        t = t_(d or 2.0)
        x = np.sin(2 * np.pi * 1100 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 25 * t)))
        return filt(x, "low", 3000).astype(np.float32) * 0.25 * env(len(t), 0.01, 0.2)
    if name == "bell_broken":
        b = sfx("bell", 1.4)
        t = t_(1.0)
        f = 1100 * np.exp(-t * 2)
        tail = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2 * np.exp(-t * 2)
        return np.concatenate([b, np.tanh(tail * 3).astype(np.float32) * 0.3])
    if name == "pa":  # PA click + hum
        t = t_(0.6)
        return (np.sin(2 * np.pi * 50 * t) * 0.1 + rng.normal(0, 0.05, len(t)) * np.exp(-t * 6)).astype(np.float32)
    if name == "crowd":
        t = t_(d or 4)
        x = filt(rng.normal(0, 1, len(t)), "band", [250, 1800])
        mod = 0.7 + 0.3 * filt(rng.normal(0, 1, len(t)), "low", 3) * 8
        return (x * mod * 0.25 * env(len(t), 0.5, 0.5)).astype(np.float32)
    if name == "rattle":  # stretcher wheels
        t = t_(d or 2)
        x = rng.normal(0, 1, len(t)) * (np.sin(2 * np.pi * 14 * t) > 0.6)
        return filt(x.astype(np.float32), "band", [500, 3000]) * 0.3
    if name == "radio_static":
        t = t_(d or 1)
        return filt(rng.normal(0, 1, len(t)).astype(np.float32), "band", [800, 5000]) * 0.15
    if name == "flicker":
        t = t_(0.6)
        x = rng.normal(0, 1, len(t)) * (np.sin(2 * np.pi * 9 * t) > 0)
        return filt(x.astype(np.float32), "band", [80, 400]) * 0.4
    if name == "chair":
        t = t_(0.5)
        f = 300 + 400 * t
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * filt(rng.normal(0, 1, len(t)), "low", 40) * 2).astype(np.float32) * 0.4
    if name == "tick":
        out = np.zeros(int((d or 4) * SR), np.float32)
        for i in range(int(d or 4)):
            s = int(i * SR)
            out[s:s + 300] += rng.normal(0, 0.3, 300).astype(np.float32) * np.exp(-np.arange(300) / 40)
        return out
    if name == "creak":
        t = t_(0.9)
        f = 180 + 60 * np.sin(2 * np.pi * 2 * t)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(t)) > 0.3)
        return filt(x.astype(np.float32), "band", [300, 1500]) * 0.2 * env(len(t), 0.1, 0.2)
    if name == "hum":  # streetlamp
        t = t_(d or 3)
        return (np.sin(2 * np.pi * 100 * t) * 0.06 + np.sin(2 * np.pi * 200 * t) * 0.03).astype(np.float32)
    raise ValueError(name)


# ------------------------------------------------------------------ ambience beds
def ambience(name, d):
    t = t_(d)
    n = len(t)
    if name == "room":
        return filt(rng.normal(0, 1, n).astype(np.float32), "low", 300) * 0.05
    if name == "birds":
        x = filt(rng.normal(0, 1, n).astype(np.float32), "low", 400) * 0.03
        for _ in range(int(d * 1.5)):
            s = int(rng.random() * (n - SR))
            tt = t_(0.15)
            f = 3000 + 1500 * np.sin(np.pi * tt / 0.15)
            x[s:s + len(tt)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.05 * np.sin(np.pi * tt / 0.15)
        return x
    if name == "street":
        x = filt(rng.normal(0, 1, n).astype(np.float32), "low", 600) * 0.08
        for _ in range(int(d / 4)):
            s = int(rng.random() * max(1, n - 3 * SR))
            w = sfx("whoosh")
            x[s:s + len(w)] += w * 0.6
        return x
    if name == "class":
        x = filt(rng.normal(0, 1, n).astype(np.float32), "low", 250) * 0.04
        return x + sfx("tick", d)[:n] * 0.3
    if name == "cafeteria":
        return sfx("crowd", d)[:n] * 1.3
    if name == "night":
        x = filt(rng.normal(0, 1, n).astype(np.float32), "low", 200) * 0.04
        return x
    if name == "none":
        return np.zeros(n, np.float32)
    raise ValueError(name)


# ------------------------------------------------------------------ music
def _note(f, d, kind="pad"):
    t = t_(d)
    if kind == "pad":
        x = sum(np.sin(2 * np.pi * f * k * t + k) / k ** 1.5 for k in range(1, 5))
        return (x * env(len(t), 0.4, 0.6) * 0.1).astype(np.float32)
    if kind == "piano":
        x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2 + k * 1.5)) / k for k in range(1, 6))
        return (x * env(len(t), 0.003, 0.3) * 0.25).astype(np.float32)
    if kind == "bass":
        return (np.sin(2 * np.pi * f * t) * env(len(t), 0.01, 0.2) * 0.25).astype(np.float32)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def music(name, d):
    n = int(d * SR)
    out = np.zeros(n, np.float32)
    if name == "lofi":
        bpm = 78
        beat = 60 / bpm
        chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]
        pos, i = 0.0, 0
        while pos < d:
            ch = chords[i % 4]
            for m in ch:
                nt = _note(hz(m), beat * 4, "pad")
                s = int(pos * SR)
                out[s:s + len(nt)] += nt[:max(0, n - s)]
            b = _note(hz(ch[0] - 12), beat * 4, "bass")
            s = int(pos * SR)
            out[s:s + len(b)] += b[:max(0, n - s)]
            for k in range(4):
                s = int((pos + k * beat) * SR)
                kk = t_(0.15)
                kick = np.sin(2 * np.pi * (50 + 60 * np.exp(-kk * 40)) * kk) * np.exp(-kk * 20) * (0.5 if k % 2 == 0 else 0)
                hat = filt(rng.normal(0, 1, len(kk)).astype(np.float32), "high", 6000) * np.exp(-kk * 60) * 0.15
                snare = filt(rng.normal(0, 1, len(kk)).astype(np.float32), "band", [1000, 4000]) * np.exp(-kk * 25) * (0.25 if k % 2 == 1 else 0)
                seg = (kick + hat + snare).astype(np.float32)
                out[s:s + len(seg)] += seg[:max(0, n - s)]
            pos += beat * 4
            i += 1
        out = filt(out, "low", 3500)  # warm, muffled
        return out * 0.9
    if name == "drone":
        t = t_(d)
        x = np.sin(2 * np.pi * 55 * t) * 0.18 + np.sin(2 * np.pi * 55.7 * t) * 0.18 + np.sin(2 * np.pi * 82.5 * t) * 0.06
        x += filt(rng.normal(0, 1, n).astype(np.float32), "low", 150) * 0.15
        return (x * env(n, 2.0, 1.5)).astype(np.float32)
    if name == "tension":  # drone + rising tone
        t = t_(d)
        x = music("drone", d)
        f = 220 * 2 ** (t / d)
        x += np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.05 * (t / d)
        return x.astype(np.float32)
    if name == "motif":  # D-F-A piano motif, slow
        notes = [62, 65, 69]
        pos = 0.0
        while pos < d:
            for m in notes:
                nt = _note(hz(m), 2.2, "piano")
                s = int(pos * SR)
                out[s:s + len(nt)] += nt[:max(0, n - s)]
                pos += 0.9
            pos += 1.6
        return out * 0.9
    if name == "heart":
        return sfx("heartbeat", d)[:n] * 0.8
    if name == "none":
        return out
    raise ValueError(name)


def fit(x, n):
    if len(x) >= n:
        return x[:n]
    return np.concatenate([x, np.zeros(n - len(x), np.float32)])


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype(np.int16)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
