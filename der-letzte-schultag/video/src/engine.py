"""Timeline engine: shots made of beats (dialogue, pauses, sfx, fx) -> frames + mixed audio -> MP4."""
import math
import os
import subprocess
import zlib

import numpy as np
from PIL import Image, ImageDraw

import audio as A
import chars as C
from gfx import W, H, WW, WH, OUT, font, text_outline, ease, mix
import phone as P

FPS = 24


# ------------------------------------------------------------------ beats
class Say:
    def __init__(self, who, text, fx=None, vol=1.0, speed=162, show=None):
        self.who, self.text, self.fx, self.vol, self.speed = who, text, fx, vol, speed
        self.show = show  # subtitle override


class Pause:
    def __init__(self, d):
        self.d = d


class Sfx:
    """Non-advancing sound at the current cursor (+offset)."""
    def __init__(self, name, off=0.0, vol=1.0, d=None):
        self.name, self.off, self.vol, self.d = name, off, vol, d


class Fx:
    """Non-advancing visual effect at cursor (+offset): blink, flash, shake, flicker, black, push."""
    def __init__(self, kind, off=0.0, d=0.2, k=1.0):
        self.kind, self.off, self.d, self.k = kind, off, d, k


class Text:
    """On-screen yellow subtitle without voice (inner thoughts / emphasis)."""
    def __init__(self, text, d=1.5):
        self.text, self.d = text, d


class Shot:
    def __init__(self, bg, beats, cam=None, chars=(), pov=None, phone=None, music=None, amb=None,
                 card=None, tintc=None, post=None, mvol=1.0):
        self.bg, self.beats, self.cam, self.chars = bg, beats, cam or {}, list(chars)
        self.pov, self.phone, self.music, self.amb = pov, phone, music, amb
        self.card, self.tintc, self.post, self.mvol = card, tintc, post, mvol


def card(text, d=2.0, sub=None, beats=None, music=None, amb="none"):
    return Shot(None, beats or [Pause(d)], card=(text, sub), music=music, amb=amb)


# ------------------------------------------------------------------ build timeline
def build(shots):
    t = 0.0
    lines, sfxs, fxs, subs = [], [], [], []
    for sh in shots:
        sh.start = t
        cur = t
        for b in sh.beats:
            if isinstance(b, Say):
                if b.who in A.EXTRA_VOICES:
                    v, p = A.EXTRA_VOICES[b.who]
                else:
                    v, p = C.voice(b.who)
                a = A.tts(b.text, v, p, b.speed)
                if b.fx == "radio":
                    a = A.radio(a)
                elif b.fx == "pa":
                    a = A.radio(a) * 0.9
                    echo = np.zeros(len(a) + int(0.18 * A.SR), np.float32)
                    echo[:len(a)] += a
                    echo[int(0.18 * A.SR):] += a * 0.35
                    a = echo
                elif b.fx == "phone":
                    a = A.filt(a, "band", [300, 3400])
                d = len(a) / A.SR
                lines.append(dict(who=b.who, start=cur, audio=a * b.vol, d=d))
                subs.append(dict(text=b.show if b.show is not None else b.text, start=cur, d=d, who=b.who))
                cur += d + 0.22
            elif isinstance(b, Pause):
                cur += b.d
            elif isinstance(b, Text):
                subs.append(dict(text=b.text, start=cur, d=b.d, who=None))
                cur += b.d
            elif isinstance(b, Sfx):
                sfxs.append(dict(name=b.name, start=cur + b.off, vol=b.vol, d=b.d))
            elif isinstance(b, Fx):
                fxs.append(dict(kind=b.kind, start=cur + b.off, d=b.d, k=b.k))
        sh.d = max(0.5, cur - t)
        t = cur
    return dict(shots=shots, lines=lines, sfx=sfxs, fx=fxs, subs=subs, d=t)


# ------------------------------------------------------------------ audio mix
def mix_audio(tl, path):
    n = int((tl["d"] + 0.5) * A.SR)
    voice = np.zeros(n, np.float32)
    for ln in tl["lines"]:
        s = int(ln["start"] * A.SR)
        a = ln["audio"][: n - s]
        voice[s:s + len(a)] += a
    fxbus = np.zeros(n, np.float32)
    for e in tl["sfx"]:
        a = A.sfx(e["name"], e["d"]) * e["vol"]
        s = int(e["start"] * A.SR)
        a = a[: max(0, n - s)]
        fxbus[s:s + len(a)] += a
    # music and ambience as merged segments
    mus = np.zeros(n, np.float32)
    amb = np.zeros(n, np.float32)
    for attr, bus, gen in (("music", mus, A.music), ("amb", amb, A.ambience)):
        segs = []
        for sh in tl["shots"]:
            name = getattr(sh, attr) or "none"
            vol = sh.mvol if attr == "music" else 1.0
            if segs and segs[-1][0] == name:
                segs[-1][2] = sh.start + sh.d
            else:
                segs.append([name, sh.start, sh.start + sh.d, vol])
        for name, s0, s1, vol in segs:
            if name == "none":
                continue
            seg = gen(name, s1 - s0 + 0.4) * vol
            fade = min(len(seg) // 2, int(0.25 * A.SR))
            seg[:fade] *= np.linspace(0, 1, fade)
            seg[-fade:] *= np.linspace(1, 0, fade)
            s = int(s0 * A.SR)
            seg = seg[: n - s]
            bus[s:s + len(seg)] += seg
    # duck music/ambience under dialogue
    envv = np.abs(voice)
    k = int(0.15 * A.SR)
    envv = np.convolve(envv, np.ones(k) / k, mode="same")
    duck = 1.0 - np.clip(envv * 6, 0, 0.55)
    out = voice * 1.0 + fxbus * 0.8 + mus * 0.55 * duck + amb * 0.9 * duck
    peak = np.max(np.abs(out)) or 1
    out = out / max(1.0, peak / 0.95)
    A.write_wav(path, out)


# ------------------------------------------------------------------ frame rendering
_sprite_cache = {}
_bg_cache = {}


def sprite(name, r, mouth, blink, mood, back, eyes, blood, override):
    key = (name, r, mouth, blink, mood, back, eyes, blood, str(override))
    if key not in _sprite_cache:
        _sprite_cache[key] = C.person(name, r, mouth=mouth / 2.0, blink=blink, mood=mood, back=back, eyes=eyes, blood=blood, override=override)
    return _sprite_cache[key]


def mouth_level(tl, who, T):
    for ln in tl["lines"]:
        if ln["who"] == who and ln["start"] <= T < ln["start"] + ln["d"]:
            i = int((T - ln["start"]) * A.SR)
            w = ln["audio"][max(0, i - 600): i + 600]
            a = float(np.sqrt(np.mean(w ** 2))) if len(w) else 0
            return 0 if a < 0.04 else (1 if a < 0.14 else 2)
    return 0


def interp(path, t):
    """path: list of (t, x, y) or a static (x, y)."""
    if isinstance(path[0], (int, float)):
        return path
    if t <= path[0][0]:
        return path[0][1:]
    for (t0, *a), (t1, *b) in zip(path, path[1:]):
        if t0 <= t <= t1:
            k = ease((t - t0) / max(1e-6, t1 - t0))
            return tuple(a[i] + (b[i] - a[i]) * k for i in range(len(a)))
    return path[-1][1:]


def compose_world(sh, tl, T):
    t = T - sh.start
    key = id(sh)
    if key not in _bg_cache:
        _bg_cache[key] = sh.bg() if callable(sh.bg) else sh.bg
    img = _bg_cache[key].copy()
    for c in sh.chars:
        x, y = interp(c.get("path", c.get("pos")), t)
        r = c.get("r", 60)
        h = zlib.crc32(c["name"].encode()) % 100 / 100 * 3.5
        blink = ((T + h) % 3.6) < 0.13 and c.get("eyes") != "milky" and not c.get("noblink")
        mouth = mouth_level(tl, c.get("voice", c["name"]), T) if not c.get("back") else 0
        mood = c.get("mood", "neutral")
        if callable(mood):
            mood = mood(t)
        spr, (ax, ay) = sprite(c["name"], r, mouth, blink, mood, c.get("back", False), c.get("eyes"), c.get("blood", False), c.get("override"))
        jx = jy = 0
        if c.get("jitter"):
            jx = math.sin(T * 37) * c["jitter"]
            jy = math.cos(T * 29) * c["jitter"] * 0.5
        img.paste(spr, (int(x * WW - ax + jx), int(y * WH - ay + jy)), spr)
    if sh.post:
        img = sh.post(img, t, sh.d) or img
    return img


def camera_box(sh, tl, T):
    t = T - sh.start
    cam = sh.cam
    k = ease(t / max(0.01, sh.d)) if cam.get("ease", True) else min(1, t / max(0.01, sh.d))
    a = cam.get("a", (0.5, 0.5, 1.0))
    b = cam.get("b", a)
    if "path" in cam:
        cx, cy, z = interp(cam["path"], t)
    else:
        cx, cy, z = (a[i] + (b[i] - a[i]) * k for i in range(3))
    cw, ch = W / z, H / z
    x = cx * WW - cw / 2
    y = cy * WH - ch / 2
    sh_amt = cam.get("shake", 0)
    for e in tl["fx"]:
        if e["kind"] == "shake" and e["start"] <= T < e["start"] + e["d"]:
            sh_amt += 18 * e["k"] * (1 - (T - e["start"]) / e["d"])
    if sh_amt:
        x += (math.sin(T * 31.7) + math.sin(T * 17.3)) * sh_amt * 0.5
        y += (math.cos(T * 27.1) + math.sin(T * 13.9)) * sh_amt * 0.5
    bob = cam.get("bob", 0)
    if bob:
        y += abs(math.sin(T * 5.2)) * bob - bob / 2
        x += math.sin(T * 2.6) * bob * 0.4
    x = max(0, min(WW - cw, x))
    y = max(0, min(WH - ch, y))
    return (x, y, x + cw, y + ch)


SUB_Y = int(H * 0.60)


def chunks(text, maxw=3):
    words = text.split()
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= maxw or w.endswith((",", ".", "!", "?", "…", ":")):
            out.append(" ".join(cur))
            cur = []
    if cur:
        out.append(" ".join(cur))
    return out


def draw_subs(d, tl, T, y=SUB_Y):
    for s in tl["subs"]:
        if s["start"] <= T < s["start"] + s["d"] + 0.15:
            parts = chunks(s["text"])
            total = sum(len(p) for p in parts) or 1
            acc = s["start"]
            cur = parts[-1]
            for p in parts:
                dd = s["d"] * len(p) / total
                if T < acc + dd:
                    cur = p
                    break
                acc += dd
            size = 58 if len(cur) < 16 else (50 if len(cur) < 22 else 42)
            text_outline(d, (W // 2, y), cur, size, fill=(255, 226, 40), sw=6)
            if s["who"] and s["who"] not in ("JONAS",):
                label = {"SANI": "SANITÄTER", "GRAU": "", "SCHUELER": "SCHÜLER", "SCHUELERIN": "SCHÜLERIN", "ALBERS": "FRAU ALBERS",
                         "YILMAZ": "HERR YILMAZ", "BERGER": "HERR BERGER", "BADEMANTEL": ""}.get(s["who"], s["who"])
                if label:
                    text_outline(d, (W // 2, y - 52), label, 22, fill=(255, 255, 255), sw=3)
            return


def render(name, shots, outdir, preview_times=None):
    tl = build(shots)
    os.makedirs(outdir, exist_ok=True)
    wav = os.path.join(outdir, name + ".wav")
    mix_audio(tl, wav)
    if preview_times is not None:
        paths = []
        for T in preview_times:
            img = frame(tl, T)
            p = os.path.join(outdir, f"{name}_prev_{T:05.1f}.png")
            img.save(p)
            paths.append(p)
        return tl, paths
    mp4 = os.path.join(outdir, name + ".mp4")
    nframes = int(tl["d"] * FPS) + 1
    proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                             "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", mp4], stdin=subprocess.PIPE)
    for i in range(nframes):
        proc.stdin.write(frame(tl, i / FPS).tobytes())
    proc.stdin.close()
    proc.wait()
    return tl, mp4


def find_shot(tl, T):
    for sh in tl["shots"]:
        if sh.start <= T < sh.start + sh.d:
            return sh
    return tl["shots"][-1]


def frame(tl, T):
    sh = find_shot(tl, T)
    if sh.card:
        img = Image.new("RGB", (W, H), (0, 0, 0))
        d = ImageDraw.Draw(img)
        text, sub = sh.card
        t = T - sh.start
        a = min(1, t / 0.4)
        col = tuple(int(255 * a) for _ in range(3))
        text_outline(d, (W // 2, H // 2 - (30 if sub else 0)), text, 64, fill=col, sw=0)
        if sub:
            text_outline(d, (W // 2, H // 2 + 50), sub, 30, fill=tuple(int(170 * a) for _ in range(3)), sw=0)
        draw_subs(d, tl, T)
        return img
    world = compose_world(sh, tl, T)
    box = camera_box(sh, tl, T)
    img = world.resize((W, H), Image.BILINEAR, box=box)
    if sh.tintc:
        c, al = sh.tintc(T - sh.start) if callable(sh.tintc) else sh.tintc
        img = Image.blend(img, Image.new("RGB", (W, H), c), al)
    if sh.pov or sh.phone:
        img = P.overlay(img, sh, T - sh.start, sh.d, world, box)
    # visual fx
    for e in tl["fx"]:
        if e["start"] <= T < e["start"] + e["d"]:
            k = (T - e["start"]) / e["d"]
            if e["kind"] == "blink":
                img = Image.new("RGB", (W, H), (0, 0, 0))
            elif e["kind"] == "flash":
                img = Image.blend(img, Image.new("RGB", (W, H), (255, 255, 255)), (1 - k) * e["k"])
            elif e["kind"] == "flicker":
                if int(T * 18) % 3 == 0:
                    img = Image.blend(img, Image.new("RGB", (W, H), (0, 0, 0)), 0.7)
            elif e["kind"] == "fadeout":
                img = Image.blend(img, Image.new("RGB", (W, H), (0, 0, 0)), k)
            elif e["kind"] == "black":
                img = Image.new("RGB", (W, H), (0, 0, 0))
            elif e["kind"] == "red":
                img = Image.blend(img, Image.new("RGB", (W, H), (160, 0, 0)), 0.35 * (0.5 + 0.5 * math.sin(T * 6)))
    d = ImageDraw.Draw(img)
    draw_subs(d, tl, T, int(H * 0.125) if sh.pov == "phone_full" else SUB_Y)
    return img
