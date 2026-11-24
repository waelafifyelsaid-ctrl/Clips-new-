"""Sound design + mix. Input: cues JSON from the player. Output: stereo WAV."""
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(11)


def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.normal(0, 1, int(d * SR)).astype(np.float32)
def filt(x, kind, f, order=2):
    sos = butter(order, np.array(f) / (SR / 2), btype=kind, output="sos")
    return sosfilt(sos, x).astype(np.float32)
def env(n, a=0.01, r=0.2):
    e = np.ones(n, np.float32); na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def osc(f, t, kind="sin"):
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(f, t.shape)) / SR
    if kind == "saw": return (2 * ((ph / (2 * np.pi)) % 1) - 1).astype(np.float32)
    if kind == "sq": return np.sign(np.sin(ph)).astype(np.float32)
    return np.sin(ph).astype(np.float32)
def reverb(x, wet=0.3, size=1.0):
    out = x.copy()
    for d, g in [(0.029, 0.5), (0.037, 0.45), (0.051, 0.4), (0.067, 0.35), (0.083, 0.3), (0.11, 0.25)]:
        k = int(d * size * SR)
        y = np.zeros_like(x); y[k:] = x[:-k] * g
        for _ in range(3):
            z = np.zeros_like(y); z[k:] = y[:-k] * g; y = y + z
        out += y * wet / 3
    return out
def norm(x, p=0.9): return x / (np.max(np.abs(x)) or 1) * p


# ------------------------------------------------------------------ SFX library
def sfx(name, d=None):
    if name == "boom":            # cliffhanger hit
        t = T(3.0); f = 60 * np.exp(-t * 1.3) + 26
        x = osc(f, t) * np.exp(-t * 1.1) + filt(noise(3.0), "low", 200) * np.exp(-t * 4) * 0.8
        return np.tanh(x * 1.8) * 0.95
    if name == "riser":
        dd = d or 2.5; t = T(dd)
        x = filt(noise(dd), "band", [400, 6000]) * (t / dd) ** 2 * 0.5 + osc(200 * 2 ** (2 * t / dd), t, "saw") * (t / dd) ** 2 * 0.12
        return x
    if name == "whoosh":
        t = T(0.9); return filt(noise(0.9), "band", [250, 3000]) * np.sin(np.pi * t / 0.9) ** 2 * 0.6
    if name == "explosion":       # near-ish explosion
        t = T(6.0)
        x = filt(noise(6.0), "low", 900) * np.exp(-t * 1.4) * 1.4
        x += osc(45 * np.exp(-t * 0.5) + 25, t) * np.exp(-t * 0.9) * 1.2
        x += filt(noise(6.0), "low", 120) * np.exp(-t * 0.35) * 0.9            # rumble tail
        crack = filt(noise(0.25), "high", 1500) * np.exp(-T(0.25) * 20) * 0.8
        x[:len(crack)] += crack
        return np.tanh(reverb(x, 0.35, 2.0) * 1.3) * 0.95
    if name == "explosion_far":
        x = sfx("explosion"); x = filt(x, "low", 400) * 0.7
        return np.concatenate([np.zeros(int(0.35 * SR), np.float32), x])
    if name == "debris":
        dd = d or 2.5; x = np.zeros(int(dd * SR), np.float32)
        for _ in range(40):
            s = int(rng.random() * (len(x) - 6000)); hit = filt(noise(0.12), "band", [500, 4000]) * np.exp(-T(0.12) * 40) * rng.random()
            x[s:s + len(hit)] += hit
        return x * env(len(x), 0.01, 0.8) * 0.8
    if name == "glass":
        t = T(1.4); x = filt(noise(1.4), "high", 2500) * np.exp(-t * 5)
        for f in (2900, 4100, 5300, 6400, 7200): x += osc(f, t) * np.exp(-t * (5 + f / 900)) * 0.12
        return x * 0.8
    if name == "heli":            # helicopter fly-by
        dd = d or 7; t = T(dd)
        blade = (np.sin(2 * np.pi * 17 * t) > 0.55).astype(np.float32)
        x = filt(noise(dd), "low", 500) * (0.3 + blade * 1.3) + osc(95, t, "saw") * 0.05 + filt(noise(dd), "high", 3000) * 0.04
        e = np.exp(-((t - dd * 0.5) / (dd * 0.26)) ** 2)
        return filt(x, "low", 2500) * e * 0.9
    if name == "heli_loop":
        dd = d or 4; t = T(dd); blade = (np.sin(2 * np.pi * 17 * t) > 0.55).astype(np.float32)
        return filt(filt(noise(dd), "low", 400) * (0.3 + blade), "low", 1500) * 0.5
    if name == "siren":           # German two-tone
        dd = d or 6; t = T(dd); f = np.where((t * 0.9) % 1 < 0.5, 440, 585).astype(np.float32)
        x = osc(f, t, "saw") * 0.2; x = filt(x, "band", [300, 2500])
        return reverb(x, 0.4, 3) * env(len(x), 1.0, 1.5) * 0.35
    if name == "siren_far":
        return filt(sfx("siren", d), "low", 900) * 0.6
    if name == "carhorn":
        t = T(d or 1.2); return filt(osc(420, t, "sq") * 0.2 + osc(520, t, "sq") * 0.2, "low", 2000) * env(len(t), 0.01, 0.1) * 0.5
    if name == "caralarm":
        dd = d or 4; t = T(dd); f = 900 + 500 * (np.sin(2 * np.pi * 3 * t) > 0)
        return filt(osc(f, t, "sq") * 0.15, "low", 3000) * env(len(t), 0.05, 0.3) * 0.5
    if name == "scream":
        dd = d or 1.4; t = T(dd); f = 600 + 260 * np.sin(2 * np.pi * 5 * t) + 250 * t / dd
        x = osc(f, t, "saw") * 0.3; x = filt(x, "band", [650, 3200]) + filt(noise(dd), "band", [1400, 4200]) * 0.12
        return reverb(x * env(len(t), 0.05, 0.6), 0.3) * 0.7
    if name == "scream_far":
        return filt(sfx("scream", d), "low", 1800) * 0.4
    if name == "crowd_panic":
        dd = d or 5; x = np.zeros(int(dd * SR), np.float32)
        for _ in range(int(dd * 3)):
            s = int(rng.random() * (len(x) - SR * 1.5)); sc = sfx("scream", 0.6 + rng.random()) * (0.3 + rng.random() * 0.4)
            x[s:s + len(sc)] += filt(sc, "low", 1500)
        return x * env(len(x), 0.5, 0.8) * 0.6
    if name == "growl":
        dd = d or 1.6; t = T(dd)
        x = filt(noise(dd), "band", [70, 700]) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t) * np.sin(2 * np.pi * 1.7 * t))
        x += osc(70 + 15 * np.sin(2 * np.pi * 4 * t), t, "saw") * 0.15
        return np.tanh(x * 2) * env(len(t), 0.1, 0.4) * 0.8
    if name == "zombie_scream":
        dd = d or 1.3; t = T(dd); x = np.tanh(osc(300 + 120 * np.sin(2 * np.pi * 11 * t), t, "saw") * 3) * 0.3
        x = filt(x, "band", [400, 3000]) + filt(noise(dd), "band", [800, 3500]) * 0.3
        return reverb(x * env(len(t), 0.02, 0.4), 0.25) * 0.8
    if name == "heartbeat":
        dd = d or 4; one = np.zeros(int(0.85 * SR), np.float32); b = osc(48, T(0.16)) * np.exp(-T(0.16) * 22)
        one[:len(b)] += b; one[int(0.27 * SR):int(0.27 * SR) + len(b)] += b * 0.7
        return np.tile(one, int(dd / 0.85) + 1)[:int(dd * SR)] * 1.1
    if name == "breath":
        dd = d or 3; t = T(dd); x = filt(noise(dd), "band", [400, 2200]) * np.maximum(0, np.sin(2 * np.pi * 0.9 * t)) ** 2
        return x * 0.25
    if name == "gasp":
        t = T(0.6); return filt(noise(0.6), "band", [500, 2600]) * np.sin(np.pi * t / 0.6) ** 3 * 0.5
    if name == "knock":
        t = T(0.22); return (filt(noise(0.22), "low", 600) * np.exp(-t * 30) * 1.6 + osc(110, t) * np.exp(-t * 28)) * 0.9
    if name == "knock3":
        k = sfx("knock"); gap = np.zeros(int(0.3 * SR), np.float32); return np.concatenate([k, gap, k, gap, k])
    if name == "bang":            # heavy door bang
        t = T(1.0); x = filt(noise(1.0), "low", 400) * np.exp(-t * 9) * 1.8 + osc(55, t) * np.exp(-t * 7)
        return np.tanh(reverb(x, 0.3)) * 0.95
    if name == "bang3":
        b = sfx("bang"); gap = np.zeros(int(0.12 * SR), np.float32); return np.concatenate([b[:int(0.5 * SR)], gap, b[:int(0.5 * SR)] * 0.9, gap, b])
    if name == "creak":
        dd = d or 1.0; t = T(dd); f = 160 + 50 * np.sin(2 * np.pi * 1.5 * t)
        x = osc(f, t, "saw") * (rng.random(len(t)) > 0.35); return filt(x.astype(np.float32), "band", [250, 1400]) * 0.18 * env(len(t), 0.1, 0.3)
    if name == "lock":
        t = T(0.15); return filt(noise(0.15), "band", [1500, 6000]) * np.exp(-t * 45) * 0.8
    if name == "steps":
        dd = d or 2; x = np.zeros(int(dd * SR), np.float32)
        for k in np.arange(0, dd - 0.2, 0.48):
            s = int(k * SR); st = filt(noise(0.1), "low", 500) * np.exp(-T(0.1) * 35) * 0.9; x[s:s + len(st)] += st
        return x
    if name == "run":
        dd = d or 2; x = np.zeros(int(dd * SR), np.float32)
        for k in np.arange(0, dd - 0.2, 0.28):
            s = int(k * SR); st = filt(noise(0.09), "low", 700) * np.exp(-T(0.09) * 30); x[s:s + len(st)] += st
        return x + sfx("breath", dd)[:len(x)] * 0.6
    if name == "buzz":
        out = []
        for _ in range(2): t = T(0.4); out += [filt(osc(150, t, "sq") * 0.25, "low", 400), np.zeros(int(0.2 * SR), np.float32)]
        return np.concatenate(out)
    if name == "ping":
        t = T(0.6); return (osc(1320, t) + 0.5 * osc(1980, t)) * np.exp(-t * 8) * 0.35
    if name == "ringtone":
        dd = d or 3; t = T(dd); x = osc(np.where((t * 4) % 1 < 0.5, 880, 1100), t) * ((t % 1.5) < 1.0) * 0.25; return x
    if name == "static":
        dd = d or 1; return filt(noise(dd), "band", [900, 5000]) * 0.18
    if name == "gunshot":
        t = T(1.2); x = filt(noise(1.2), "low", 3000) * np.exp(-t * 25) * 1.5 + filt(noise(1.2), "low", 300) * np.exp(-t * 4) * 0.5
        return np.tanh(reverb(x, 0.4, 2.5) * 1.5) * 0.9
    if name == "gunshot_far":
        return filt(sfx("gunshot"), "low", 1200) * 0.4
    if name == "mg_far":
        dd = d or 2; x = np.zeros(int(dd * SR), np.float32); g = sfx("gunshot_far")
        for k in np.arange(0, dd - 1.2, 0.09):
            s = int(k * SR); x[s:s + len(g)] += g * 0.5
        return x
    if name == "thud":
        t = T(0.6); return (osc(60, t) * np.exp(-t * 12) + filt(noise(0.6), "low", 300) * np.exp(-t * 18)) * 0.9
    if name == "fall":
        t = T(0.8); return (filt(noise(0.8), "low", 400) * np.exp(-t * 8) + osc(50, t) * np.exp(-t * 10)) * 0.8
    if name == "tvnews":           # news jingle
        x = np.zeros(int(2.0 * SR), np.float32)
        for i, f in enumerate([523, 659, 784, 1046]):
            s = int(i * 0.18 * SR); n = (osc(f, T(0.6)) + 0.4 * osc(f * 2, T(0.6))) * np.exp(-T(0.6) * 5) * 0.3; x[s:s + len(n)] += n
        return x
    if name == "click":
        t = T(0.05); return filt(noise(0.05), "high", 2000) * np.exp(-t * 80) * 0.5
    if name == "rumble":
        dd = d or 4; return filt(noise(dd), "low", 80) * env(int(dd * SR), 0.6, 1.2) * 1.4
    if name == "tinnitus":
        dd = d or 3; t = T(dd); return osc(6200, t) * 0.08 * np.exp(-t * 0.6)
    if name == "alarm":           # building alarm bell
        dd = d or 4; t = T(dd); return filt(osc(1050, t, "sq") * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 22 * t))), "band", [600, 4000]) * 0.12
    raise ValueError(name)


# ------------------------------------------------------------------ ambience
def amb(name, d):
    n = int(d * SR)
    if name == "room": return filt(noise(d), "low", 250) * 0.04
    if name == "city":
        x = filt(noise(d), "low", 500) * 0.07
        for k in range(int(d / 3)):
            s = int(rng.random() * max(1, n - SR)); w = sfx("whoosh") * 0.25; x[s:s + len(w)] += w[:n - s]
        return x
    if name == "city_chaos":
        x = amb("city", d) + sfx("siren_far", d)[:n] * 0.5
        for k in range(int(d / 4)):
            s = int(rng.random() * max(1, n - 2 * SR)); sc = sfx("scream_far") * 0.6; x[s:s + len(sc)] += sc[:n - s]
        return x
    if name == "birds":
        x = filt(noise(d), "low", 300) * 0.03
        for _ in range(int(d * 1.2)):
            s = int(rng.random() * max(1, n - SR)); t = T(0.14)
            c = osc(3200 + 1500 * np.sin(np.pi * t / 0.14), t) * np.sin(np.pi * t / 0.14) * 0.05; x[s:s + len(c)] += c
        return x
    if name == "wind": return filt(noise(d), "band", [100, 900]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * T(d))) * 0.12
    if name == "fire": return (filt(noise(d), "low", 600) * 0.1 + (rng.random(n) > 0.9995) * rng.random(n) * 0.6).astype(np.float32)
    if name == "night": return filt(noise(d), "low", 180) * 0.05
    if name == "none": return np.zeros(n, np.float32)
    raise ValueError(name)


# ------------------------------------------------------------------ music
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def pad(m, d, bright=0.4):
    t = T(d); x = sum(osc(hz(m) * (1 + det), t, "saw") for det in (-0.004, 0, 0.005)) / 3
    return filt(x, "low", 600 + 1600 * bright) * env(len(t), d * 0.3, d * 0.4) * 0.12
def piano(m, d=2.5, v=0.3):
    t = T(d); x = sum(osc(hz(m) * k, t) * np.exp(-t * (1.8 + k * 1.3)) / k for k in range(1, 6))
    return x * env(len(t), 0.003, 0.3) * v

def music(name, d):
    n = int(d * SR); out = np.zeros(n, np.float32)
    def put(x, at):
        s = int(at * SR)
        if s >= n: return
        x = x[: n - s]; out[s:s + len(x)] += x
    if name == "morning":        # calm, slightly melancholic
        chords = [[57, 64, 69, 72], [53, 60, 65, 69], [48, 55, 60, 64], [55, 62, 67, 71]]
        pos, i = 0.0, 0
        while pos < d:
            for m in chords[i % 4]: put(pad(m, 4.4, 0.25), pos)
            for j, m in enumerate([76, 72, 74, 69][i % 4:i % 4 + 1] * 1): put(piano(m, 3, 0.12), pos + 0.5)
            pos += 4; i += 1
        return filt(out, "low", 3000) * 0.9
    if name == "drone":
        t = T(d); x = osc(55, t) * 0.2 + osc(55.6, t) * 0.2 + osc(82.4, t) * 0.07 + filt(noise(d), "low", 140) * 0.18
        return x * env(n, 1.5, 1.5)
    if name == "tension":        # pulsing low ostinato
        t = T(d); x = music("drone", d) * 0.8
        beat = 60 / 100
        for k in np.arange(0, d, beat / 2):
            p = osc(hz(33), T(0.3)) * np.exp(-T(0.3) * 9) * 0.6; put(p, k)
        x += out; out[:] = 0
        f = 220 * 2 ** (t / max(d, 1)); x += osc(f, t) * 0.03 * (t / max(d, 1))
        return x
    if name == "action":
        beat = 60 / 140; pos = 0.0; k = 0
        while pos < d:
            kick = osc(50 + 80 * np.exp(-T(0.2) * 35), T(0.2)) * np.exp(-T(0.2) * 14) * 0.9
            put(kick, pos)
            if k % 2 == 1: put(filt(noise(0.2), "band", [800, 5000]) * np.exp(-T(0.2) * 18) * 0.5, pos)
            put(filt(noise(0.05), "high", 6000) * np.exp(-T(0.05) * 60) * 0.25, pos + beat / 2)
            put(filt(osc(hz(36 + [0, 0, 3, -2][(k // 4) % 4]), T(beat), "saw"), "low", 400) * 0.25 * env(int(beat * SR), 0.01, 0.1), pos)
            pos += beat; k += 1
        return out * env(n, 0.3, 0.5)
    if name == "sad":
        seq = [62, 65, 69, 67, 65, 64, 62, 60]; pos = 0.0; i = 0
        while pos < d:
            put(piano(seq[i % len(seq)], 3.0, 0.22), pos); put(pad([50, 46, 53, 48][(i // 2) % 4], 3.5, 0.2) * 0.8, pos) if i % 2 == 0 else None
            pos += 1.15; i += 1
        return out * env(n, 0.5, 1.0)
    if name == "heart": return sfx("heartbeat", d)[:n] * 0.9
    if name == "none": return out
    raise ValueError(name)


def main(cues_path, out_path):
    C = json.load(open(cues_path))
    d = C["d"] + 0.6; n = int(d * SR)
    voice = np.zeros(n, np.float32); fxb = np.zeros(n, np.float32); mus = np.zeros(n, np.float32); ab = np.zeros(n, np.float32)
    import wave as W
    for ln in C["lines"]:
        with W.open(ln["file"]) as w: a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if ln.get("fx") == "radio": a = np.tanh(filt(a, "band", [350, 3200]) * 3) * 0.5 + noise(len(a) / SR)[:len(a)] * 0.015
        if ln.get("fx") == "phone": a = filt(a, "band", [300, 3400])
        if ln.get("fx") == "whisper": a = a * 0.6
        if ln.get("fx") == "far": a = reverb(filt(a, "low", 2500), 0.5) * 0.6
        s = int(ln["start"] * SR); a = a[: n - s] * ln.get("vol", 1)
        voice[s:s + len(a)] += a
    voice = reverb(voice, 0.08, 0.6)
    for e in C["sfx"]:
        a = sfx(e["name"], e.get("d")) * e.get("vol", 1)
        s = int(e["start"] * SR); a = a[: max(0, n - s)]
        fxb[s:s + len(a)] += a
    for key, bus, gen in (("music", mus, music), ("amb", ab, amb)):
        segs = []
        for m in C["music"]:
            nm, vol = m[key], m["mvol" if key == "music" else "avol"]
            if segs and segs[-1][0] == nm and abs(segs[-1][3] - vol) < 1e-6: segs[-1][2] = m["start"] + m["d"]
            else: segs.append([nm, m["start"], m["start"] + m["d"], vol])
        for nm, s0, s1, vol in segs:
            if nm == "none": continue
            seg = gen(nm, s1 - s0 + 0.5) * vol
            f = min(len(seg) // 2, int(0.3 * SR)); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
            s = int(s0 * SR); seg = seg[: n - s]; bus[s:s + len(seg)] += seg
    e = np.convolve(np.abs(voice), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
    duck = 1 - np.clip(e * 5, 0, 0.6)
    mix = voice * 1.0 + fxb * 0.85 + mus * 0.5 * duck + ab * 0.8 * duck
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = mix / max(1.0, np.max(np.abs(mix)) / 0.97)
    st = np.stack([mix, mix], axis=1)
    with wave.open(out_path, "w") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
