"""Characters drawn as cel-shaded busts/figures. Each character renders to an RGBA sprite."""
from PIL import Image, ImageDraw
from gfx import OUT, poly, ellipse, line, rgb, rect

SKIN_L = (247, 214, 184)
SKIN_M = (214, 164, 120)
SKIN_D = (140, 92, 62)

CHARS = {
    "LEON":   dict(skin=SKIN_L, hair=(120, 78, 40), hair_style="messy", top=(52, 60, 72), top_style="hoodie", hood=True, voice="de6", pitch=58),
    "EMILIA": dict(skin=SKIN_L, hair=(58, 40, 32), hair_style="ponytail", top=(92, 128, 170), top_style="jacket", inner=(235, 235, 230), voice="de5", pitch=55),
    "TIM":    dict(skin=SKIN_D, hair=(25, 22, 22), hair_style="buzz", top=(150, 118, 70), top_style="hoodie", extras=["glasses", "lanyard"], voice="de4", pitch=46),
    "BERGER": dict(skin=SKIN_L, hair=(150, 140, 130), hair_style="receding", top=(120, 104, 86), top_style="blazer", inner=(220, 220, 210), extras=["glasses", "stubble"], voice="de2", pitch=30),
    "MAMA":   dict(skin=SKIN_L, hair=(150, 96, 60), hair_style="bob", top=(190, 120, 110), top_style="sweater", voice="de7", pitch=52),
    "DENNIS": dict(skin=SKIN_M, hair=(40, 30, 25), hair_style="fade", top=(200, 70, 60), top_style="hoodie", voice="de4", pitch=62),
    "MARVIN": dict(skin=SKIN_L, hair=(200, 170, 90), hair_style="messy", top=(70, 110, 80), top_style="hoodie", voice="de6", pitch=70),
    "ALBERS": dict(skin=SKIN_L, hair=(90, 60, 50), hair_style="bun", top=(130, 90, 140), top_style="cardigan", inner=(240, 230, 220), extras=["glasses"], voice="de1", pitch=50),
    "YILMAZ": dict(skin=SKIN_M, hair=(30, 25, 22), hair_style="buzz", top=(40, 90, 160), top_style="track", extras=["beard"], voice="de2", pitch=40),
    "SANI":   dict(skin=SKIN_L, hair=(60, 50, 40), hair_style="buzz", top=(220, 90, 40), top_style="vest", voice="de4", pitch=38),
    "GRAU":   dict(skin=SKIN_L, hair=(50, 50, 55), hair_style="slick", top=(118, 120, 124), top_style="jacket", inner=(60, 60, 64), extras=["earpiece"], voice="de2", pitch=25),
    "POLIZIST": dict(skin=SKIN_L, hair=(70, 60, 50), hair_style="buzz", top=(40, 60, 100), top_style="vest_police", voice="de4", pitch=35),
    "BADEMANTEL": dict(skin=(200, 205, 195), hair=(120, 120, 120), hair_style="messy", top=(160, 170, 190), top_style="robe", eyes="milky", voice="de4", pitch=30),
    "SCHUELER": dict(skin=SKIN_M, hair=(70, 50, 30), hair_style="fade", top=(90, 90, 160), top_style="hoodie", voice="de6", pitch=64),
    "SCHUELERIN": dict(skin=SKIN_L, hair=(170, 110, 60), hair_style="long", top=(200, 160, 80), top_style="hoodie", voice="de7", pitch=60),
}


def _hair_back(d, s, cx, cy, r, c):
    """Hair parts that sit behind the head."""
    st = s["hair_style"]
    if st == "ponytail":
        poly(d, [(cx + r * 0.6, cy - r * 0.2), (cx + r * 1.25, cy + r * 0.3), (cx + r * 1.1, cy + r * 1.6), (cx + r * 0.7, cy + r * 0.7)], c)
    elif st == "long":
        poly(d, [(cx - r * 1.05, cy - r * 0.3), (cx + r * 1.05, cy - r * 0.3), (cx + r * 1.15, cy + r * 1.9), (cx - r * 1.15, cy + r * 1.9)], c)
    elif st == "bob":
        poly(d, [(cx - r * 1.1, cy - r * 0.4), (cx + r * 1.1, cy - r * 0.4), (cx + r * 1.15, cy + r * 1.0), (cx - r * 1.15, cy + r * 1.0)], c)
    elif st == "bun":
        ellipse(d, cx, cy - r * 1.1, r * 0.45, r * 0.4, c)


def _hair_front(d, s, cx, cy, r, c):
    st = s["hair_style"]
    sh = rgb(c, 0.75)
    if st in ("messy",):
        pts = [(cx - r * 1.02, cy - r * 0.1), (cx - r * 1.0, cy - r * 0.8), (cx - r * 0.5, cy - r * 1.15), (cx - r * 0.1, cy - r * 1.3),
               (cx + r * 0.4, cy - r * 1.2), (cx + r * 0.9, cy - r * 0.95), (cx + r * 1.05, cy - r * 0.2), (cx + r * 0.7, cy - r * 0.55),
               (cx + r * 0.35, cy - r * 0.45), (cx + r * 0.1, cy - r * 0.62), (cx - r * 0.25, cy - r * 0.45), (cx - r * 0.6, cy - r * 0.58)]
        poly(d, pts, c)
    elif st == "ponytail" or st == "long" or st == "bob" or st == "bun":
        pts = [(cx - r * 1.05, cy + r * 0.1), (cx - r * 1.0, cy - r * 0.7), (cx - r * 0.4, cy - r * 1.12), (cx + r * 0.4, cy - r * 1.12),
               (cx + r * 1.0, cy - r * 0.7), (cx + r * 1.05, cy + r * 0.1), (cx + r * 0.85, cy - r * 0.45), (cx + r * 0.1, cy - r * 0.62),
               (cx - r * 0.5, cy - r * 0.4), (cx - r * 0.85, cy - r * 0.2)]
        poly(d, pts, c)
        line(d, [(cx + r * 0.1, cy - r * 1.1), (cx - r * 0.1, cy - r * 0.62)], fill=sh, width=3)
    elif st == "buzz" or st == "fade":
        pts = [(cx - r * 0.98, cy - r * 0.25), (cx - r * 0.9, cy - r * 0.75), (cx - r * 0.4, cy - r * 1.08), (cx + r * 0.4, cy - r * 1.08),
               (cx + r * 0.9, cy - r * 0.75), (cx + r * 0.98, cy - r * 0.25), (cx + r * 0.6, cy - r * 0.55), (cx - r * 0.6, cy - r * 0.55)]
        poly(d, pts, c)
    elif st == "receding":
        poly(d, [(cx - r * 1.0, cy + r * 0.05), (cx - r * 0.95, cy - r * 0.6), (cx - r * 0.7, cy - r * 0.75), (cx - r * 0.65, cy - r * 0.2)], c)
        poly(d, [(cx + r * 1.0, cy + r * 0.05), (cx + r * 0.95, cy - r * 0.6), (cx + r * 0.7, cy - r * 0.75), (cx + r * 0.65, cy - r * 0.2)], c)
    elif st == "slick":
        poly(d, [(cx - r * 1.0, cy - r * 0.15), (cx - r * 0.9, cy - r * 0.8), (cx - r * 0.2, cy - r * 1.12), (cx + r * 0.7, cy - r * 1.0),
                 (cx + r * 1.0, cy - r * 0.5), (cx + r * 0.95, cy - r * 0.15), (cx + r * 0.5, cy - r * 0.7), (cx - r * 0.6, cy - r * 0.6)], c)


def _torso(d, s, cx, top, r, H, back=False):
    c = s["top"]
    sh = rgb(c, 0.72)
    st = s["top_style"]
    nw = r * 0.38
    # neck
    poly(d, [(cx - nw, top - r * 0.4), (cx + nw, top - r * 0.4), (cx + nw, top + r * 0.3), (cx - nw, top + r * 0.3)], rgb(s["skin"], 0.85))
    sw = r * 2.1
    body = [(cx - sw * 0.55, top + r * 0.15), (cx + sw * 0.55, top + r * 0.15), (cx + sw, top + r * 0.75), (cx + sw * 1.08, H), (cx - sw * 1.08, H), (cx - sw, top + r * 0.75)]
    if st == "robe":
        c = s["top"]
    poly(d, body, c)
    # shade on right side
    poly(d, [(cx + sw * 0.55, top + r * 0.15), (cx + sw, top + r * 0.75), (cx + sw * 1.08, H), (cx + sw * 0.62, H), (cx + sw * 0.5, top + r * 0.9)], sh, width=0)
    line(d, body + [body[0]], width=5)
    # arm creases
    line(d, [(cx - sw * 0.78, top + r * 1.0), (cx - sw * 0.86, H)], width=4)
    line(d, [(cx + sw * 0.78, top + r * 1.0), (cx + sw * 0.86, H)], width=4)
    if back:
        return
    if st == "hoodie":
        if s.get("hood", True):
            poly(d, [(cx - r * 1.05, top + r * 0.1), (cx - r * 0.45, top - r * 0.25), (cx + r * 0.45, top - r * 0.25), (cx + r * 1.05, top + r * 0.1), (cx + r * 0.5, top + r * 0.55), (cx - r * 0.5, top + r * 0.55)], rgb(c, 0.85))
        line(d, [(cx - r * 0.25, top + r * 0.5), (cx - r * 0.3, top + r * 1.6)], width=3, fill=(235, 235, 235))
        line(d, [(cx + r * 0.25, top + r * 0.5), (cx + r * 0.3, top + r * 1.6)], width=3, fill=(235, 235, 235))
        poly(d, [(cx - r * 0.9, top + r * 2.6), (cx + r * 0.9, top + r * 2.6), (cx + r * 1.05, top + r * 3.4), (cx - r * 1.05, top + r * 3.4)], rgb(c, 0.9), width=4)
    elif st in ("jacket", "blazer", "cardigan"):
        inner = s.get("inner", (230, 230, 230))
        poly(d, [(cx - r * 0.55, top + r * 0.15), (cx + r * 0.55, top + r * 0.15), (cx + r * 0.35, H), (cx - r * 0.35, H)], inner, width=4)
        poly(d, [(cx - r * 0.55, top + r * 0.15), (cx - r * 0.1, top + r * 1.3), (cx - r * 0.3, H), (cx - r * 0.9, H), (cx - r * 1.0, top + r * 0.7)], c, width=4)
        poly(d, [(cx + r * 0.55, top + r * 0.15), (cx + r * 0.1, top + r * 1.3), (cx + r * 0.3, H), (cx + r * 0.9, H), (cx + r * 1.0, top + r * 0.7)], sh, width=4)
        if st == "blazer":
            line(d, [(cx - r * 0.08, top + r * 0.3), (cx, top + r * 1.6)], fill=(110, 40, 40), width=int(r * 0.18))
    elif st == "sweater":
        line(d, [(cx - r * 0.6, top + r * 0.3), (cx, top + r * 0.6), (cx + r * 0.6, top + r * 0.3)], width=4)
    elif st == "track":
        line(d, [(cx, top + r * 0.2), (cx, H)], width=4, fill=(230, 230, 230))
        line(d, [(cx - sw * 0.95, top + r * 0.9), (cx - sw * 1.05, H)], width=6, fill=(240, 240, 240))
        line(d, [(cx + sw * 0.95, top + r * 0.9), (cx + sw * 1.05, H)], width=6, fill=(240, 240, 240))
    elif st == "vest":
        for yy in (top + r * 1.4, top + r * 1.9):
            line(d, [(cx - sw * 0.9, yy), (cx + sw * 0.9, yy)], width=int(r * 0.18), fill=(235, 235, 120))
        d.text((cx, top + r * 0.9), "NOTARZT", fill=(255, 255, 255), anchor="mm")
    elif st == "vest_police":
        poly(d, [(cx - r * 1.4, top + r * 0.7), (cx + r * 1.4, top + r * 0.7), (cx + r * 1.4, top + r * 2.6), (cx - r * 1.4, top + r * 2.6)], (30, 30, 40), width=4)
        d.text((cx, top + r * 1.5), "POLIZEI", fill=(255, 255, 255), anchor="mm")
    elif st == "robe":
        line(d, [(cx - r * 0.5, top + r * 0.2), (cx + r * 0.4, top + r * 2.5)], width=5)
        line(d, [(cx - sw, top + r * 2.4), (cx + sw, top + r * 2.4)], width=int(r * 0.2), fill=rgb(c, 0.6))
    if "lanyard" in s.get("extras", []):
        line(d, [(cx - r * 0.35, top + r * 0.2), (cx, top + r * 1.5), (cx + r * 0.35, top + r * 0.2)], fill=(200, 40, 50), width=4)
        rect(d, cx - r * 0.15, top + r * 1.45, cx + r * 0.15, top + r * 1.85, (230, 200, 60), width=3)


def _face(d, s, cx, cy, r, mouth, blink, mood, eyes):
    skin = s["skin"]
    # ears
    ellipse(d, cx - r * 0.98, cy + r * 0.08, r * 0.16, r * 0.22, skin, width=4)
    ellipse(d, cx + r * 0.98, cy + r * 0.08, r * 0.16, r * 0.22, rgb(skin, 0.88), width=4)
    # head (slightly long oval)
    ellipse(d, cx, cy, r * 0.95, r * 1.1, skin)
    # cel shade on the right cheek
    d.chord((cx - r * 0.9, cy - r * 1.05, cx + r * 0.9, cy + r * 1.05), 290, 70, fill=rgb(skin, 0.9))
    d.ellipse((cx - r * 0.95, cy - r * 1.1, cx + r * 0.95, cy + r * 1.1), outline=OUT, width=5)
    if "stubble" in s.get("extras", []) or "beard" in s.get("extras", []):
        k = 0.55 if "beard" in s.get("extras", []) else 0.82
        d.chord((cx - r * 0.9, cy - r * 0.2, cx + r * 0.9, cy + r * 1.1), 20, 160, fill=rgb(skin, k))
        d.ellipse((cx - r * 0.95, cy - r * 1.1, cx + r * 0.95, cy + r * 1.1), outline=OUT, width=5)
    ex, ey, er = r * 0.38, cy - r * 0.05, r * 0.25
    milky = eyes == "milky"
    for sx in (-1, 1):
        x = cx + sx * ex
        if blink:
            line(d, [(x - er, ey), (x + er, ey)], width=4)
        else:
            ellipse(d, x, ey, er, er * (1.15 if mood == "scared" else 1.0), (245, 245, 240) if not milky else (225, 232, 228), width=4)
            if milky:
                ellipse(d, x, ey, er * 0.55, er * 0.55, (200, 210, 205), outline=None, width=0)
            else:
                pr = er * (0.38 if mood == "scared" else 0.5)
                ellipse(d, x + r * 0.02, ey + r * 0.03, pr, pr, (38, 36, 40), outline=None, width=0)
                ellipse(d, x - pr * 0.3, ey - pr * 0.35, pr * 0.25, pr * 0.25, (255, 255, 255), outline=None, width=0)
        # brows
        by = ey - er * 1.55
        if mood == "angry":
            line(d, [(x - sx * er * 1.0, by - r * 0.08), (x + sx * er * 0.9, by + r * 0.1)], width=6)
        elif mood == "scared" or mood == "worried":
            line(d, [(x - sx * er * 1.0, by + r * 0.06), (x + sx * er * 0.9, by - r * 0.08)], width=6)
        else:
            line(d, [(x - er, by), (x + er, by - r * 0.03)], width=6)
    # nose
    line(d, [(cx + r * 0.02, cy + r * 0.12), (cx - r * 0.08, cy + r * 0.35), (cx + r * 0.08, cy + r * 0.38)], width=3, fill=rgb(skin, 0.55))
    # mouth
    my = cy + r * 0.62
    if mouth > 0.15:
        oh = r * (0.08 + 0.22 * mouth)
        ellipse(d, cx, my, r * 0.2, oh, (90, 30, 35), width=4)
    else:
        if mood == "smile":
            d.arc((cx - r * 0.28, my - r * 0.22, cx + r * 0.28, my + r * 0.1), 20, 160, fill=OUT, width=4)
        elif mood in ("scared", "worried", "angry"):
            d.arc((cx - r * 0.22, my - r * 0.02, cx + r * 0.22, my + r * 0.25), 200, 340, fill=OUT, width=4)
        else:
            line(d, [(cx - r * 0.18, my), (cx + r * 0.18, my - r * 0.02)], width=4)
    if "glasses" in s.get("extras", []):
        for sx in (-1, 1):
            d.rounded_rectangle((cx + sx * ex - er * 1.35, ey - er * 1.1, cx + sx * ex + er * 1.35, ey + er * 1.1), radius=int(er * 0.4), outline=OUT, width=4)
        line(d, [(cx - ex + er * 1.35, ey), (cx + ex - er * 1.35, ey)], width=4)
    if "earpiece" in s.get("extras", []):
        line(d, [(cx + r * 1.0, cy + r * 0.1), (cx + r * 1.05, cy + r * 0.9), (cx + r * 0.9, cy + r * 1.5)], fill=(230, 230, 230), width=3)


def person(name, r=60, mouth=0.0, blink=False, mood="neutral", back=False, eyes=None, blood=False, override=None):
    """Return RGBA sprite and the anchor (head centre) inside it."""
    s = dict(CHARS[name])
    if override:
        s.update(override)
    eyes = eyes or s.get("eyes", "normal")
    Wd, Hd = int(r * 6), int(r * 9)
    img = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = Wd / 2, r * 1.6
    _hair_back(d, s, cx, cy, r, s["hair"])
    _torso(d, s, cx, cy + r * 1.25, r, Hd, back)
    if back:
        ellipse(d, cx, cy, r * 0.97, r * 1.1, s["hair"])
        _hair_back(d, s, cx, cy, r, s["hair"])
        if s["hair_style"] == "receding":
            ellipse(d, cx, cy - r * 0.55, r * 0.55, r * 0.4, rgb(s["skin"], 0.9), outline=None, width=0)
    else:
        _face(d, s, cx, cy, r, mouth, blink, mood, eyes)
        _hair_front(d, s, cx, cy, r, s["hair"])
    if blood:
        for (ox, oy, rr) in [(0.6, 3.2, 0.35), (0.9, 3.6, 0.22), (-0.4, 4.1, 0.18)]:
            ellipse(d, cx + r * ox, cy + r * oy, r * rr, r * rr * 0.8, (130, 20, 25), outline=None, width=0)
    return img, (cx, cy)


def voice(name):
    s = CHARS.get(name)
    if not s:
        return "de2", 40
    return s["voice"], s["pitch"]
