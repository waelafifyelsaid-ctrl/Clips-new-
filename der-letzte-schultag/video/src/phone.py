"""POV hands and the phone UI that is used as a storytelling device."""
from PIL import Image, ImageDraw

from gfx import W, H, OUT, font, poly, ellipse, line, rgb, text_outline, ease

SLEEVE = (120, 124, 132)
SKIN = (247, 214, 184)


def _wrap(text, f, maxw, d):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=f) <= maxw:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _screen(content, sw, sh, t, d_total, world, box):
    """Render phone screen content to an image of size sw x sh."""
    k = content["kind"]
    scr = Image.new("RGB", (sw, sh), content.get("bgc", (16, 16, 22)))
    d = ImageDraw.Draw(scr)
    u = sw / 320  # unit
    def status(dark=True, label=None):
        c = (240, 240, 240)
        d.text((14 * u, 8 * u), content.get("clock", "06:45"), font=font(int(13 * u)), fill=c)
        d.text((sw - 14 * u, 8 * u), label or content.get("net", "5G ▮▮▮"), font=font(int(11 * u)), fill=c, anchor="ra")

    if k == "lock":
        from gfx import vgradient
        vgradient(scr, (0, 0, sw, sh), (40, 50, 90), (120, 70, 110))
        d = ImageDraw.Draw(scr)
        status()
        d.text((sw / 2, 70 * u), content.get("clock", "06:45"), font=font(int(58 * u)), fill=(255, 255, 255), anchor="mm")
        d.text((sw / 2, 112 * u), content.get("date", "Montag, 24. November"), font=font(int(13 * u), False), fill=(230, 230, 240), anchor="mm")
        y = 150 * u
        for (app, title, body, at) in content["notes"]:
            if t < at:
                continue
            a = min(1, (t - at) / 0.25)
            yy = y - (1 - a) * 20 * u
            f2 = font(int(12 * u), False)
            lines = _wrap(body, f2, sw - 52 * u, d)[:3]
            hgt = (40 + 15 * len(lines)) * u
            d.rounded_rectangle((10 * u, yy, sw - 10 * u, yy + hgt), radius=int(14 * u), fill=(235, 235, 240))
            d.text((22 * u, yy + 9 * u), app.upper(), font=font(int(10 * u)), fill=(110, 110, 120))
            d.text((22 * u, yy + 24 * u), title, font=font(int(13 * u)), fill=(20, 20, 25))
            for i, ln in enumerate(lines):
                d.text((22 * u, yy + (42 + 15 * i) * u), ln, font=f2, fill=(40, 40, 45))
            y += hgt + 8 * u
    elif k == "chat":
        status()
        d.rectangle((0, 28 * u, sw, 68 * u), fill=(30, 30, 38))
        d.text((sw / 2, 48 * u), content["contact"], font=font(int(15 * u)), fill=(255, 255, 255), anchor="mm")
        y = 84 * u
        for (side, text, at) in content["msgs"]:
            if t < at:
                continue
            f2 = font(int(17 * u), False)
            lines = _wrap(text, f2, sw * 0.72, d)
            hgt = (21 * len(lines) + 16) * u
            wmax = max(d.textlength(l, font=f2) for l in lines) + 24 * u
            if side == "in":
                x0, col, tc = 10 * u, (55, 55, 66), (255, 255, 255)
            else:
                x0, col, tc = sw - 10 * u - wmax, (40, 120, 230), (255, 255, 255)
            red = content.get("red") and side == "in"
            if red:
                col = (150, 20, 30)
            d.rounded_rectangle((x0, y, x0 + wmax, y + hgt), radius=int(14 * u), fill=col)
            for i, ln in enumerate(lines):
                d.text((x0 + 12 * u, y + (8 + 21 * i) * u), ln, font=f2, fill=tc)
            y += hgt + 10 * u
    elif k in ("camera", "video"):
        z = content.get("zoom", 1.6)
        if "zoom_path" in content:
            z = content["zoom_path"](t)
        cx, cy = content.get("center", (0.5, 0.45))
        if "center_path" in content:
            cx, cy = content["center_path"](t)
        bw = (box[2] - box[0]) / z
        bh = bw * sh / sw
        if "wcenter_path" in content:
            wx, wy = content["wcenter_path"](t)
            x0, y0 = world.width * wx - bw / 2, world.height * wy - bh / 2
        else:
            x0 = box[0] + (box[2] - box[0]) * cx - bw / 2
            y0 = box[1] + (box[3] - box[1]) * cy - bh / 2
        x0 = max(0, min(world.width - bw, x0))
        y0 = max(0, min(world.height - bh, y0))
        scr = world.resize((sw, sh), Image.BILINEAR, box=(x0, y0, x0 + bw, y0 + bh))
        d = ImageDraw.Draw(scr)
        if k == "camera":
            if int(t * 2) % 2 == 0:
                ellipse(d, 22 * u, 22 * u, 6 * u, 6 * u, (230, 30, 30), outline=None, width=0)
            secs = int(t + content.get("t0", 0))
            d.text((34 * u, 14 * u), f"REC 00:{secs:02d}", font=font(int(12 * u)), fill=(255, 255, 255))
            d.text((sw - 14 * u, 14 * u), f"{z:.1f}x", font=font(int(12 * u)), fill=(255, 220, 60), anchor="ra")
            for (x, y) in ((0.33, 0), (0.66, 0)):
                d.line([(sw * x, 0), (sw * x, sh)], fill=(255, 255, 255), width=1)
            for y in (0.33, 0.66):
                d.line([(0, sh * y), (sw, sh * y)], fill=(255, 255, 255), width=1)
        else:
            d.rectangle((0, sh - 26 * u, sw, sh), fill=(0, 0, 0))
            p = min(1, t / max(0.1, d_total))
            d.rectangle((10 * u, sh - 15 * u, 10 * u + (sw - 20 * u) * content.get("progress", p), sh - 11 * u), fill=(255, 40, 60))
        for (txt, at, at2) in content.get("labels", []):
            if at <= t < at2:
                d.rounded_rectangle((8 * u, sh - 120 * u, sw - 8 * u, sh - 70 * u), radius=int(10 * u), fill=(0, 0, 0))
                d.text((sw / 2, sh - 95 * u), txt, font=font(int(13 * u)), fill=(255, 230, 80), anchor="mm")
    elif k == "prompt":
        status()
        d.rectangle((0, 0, sw, sh), fill=(30, 30, 34))
        d.rounded_rectangle((20 * u, sh * 0.35, sw - 20 * u, sh * 0.62), radius=int(16 * u), fill=(60, 60, 68))
        d.text((sw / 2, sh * 0.40), "Video löschen?", font=font(int(17 * u)), fill=(255, 255, 255), anchor="mm")
        d.text((sw / 2, sh * 0.46), "VID_0752.mp4", font=font(int(12 * u), False), fill=(190, 190, 200), anchor="mm")
        tap = content.get("tap", 99)
        c1 = (230, 60, 60)
        c2 = (120, 180, 255) if t < tap else (255, 255, 255)
        bg2 = None if t < tap else (40, 90, 200)
        if bg2:
            d.rounded_rectangle((sw * 0.52, sh * 0.52, sw - 30 * u, sh * 0.59), radius=int(10 * u), fill=bg2)
        d.text((sw * 0.3, sh * 0.555), "Löschen", font=font(int(15 * u)), fill=c1, anchor="mm")
        d.text((sw * 0.7, sh * 0.555), "Abbrechen", font=font(int(15 * u)), fill=c2, anchor="mm")
    elif k == "mail":
        status()
        d.rectangle((0, 28 * u, sw, sh), fill=(245, 245, 248))
        d.text((16 * u, 44 * u), content["sender"], font=font(int(13 * u)), fill=(30, 30, 40))
        d.text((16 * u, 64 * u), content["subject"], font=font(int(15 * u)), fill=(10, 10, 20))
        y = 96 * u
        f2 = font(int(13 * u), False)
        for para in content["body"]:
            for ln in _wrap(para, f2, sw - 32 * u, d):
                bold = "regulär" in ln
                d.text((16 * u, y), ln, font=font(int(13 * u), bold), fill=(200, 20, 30) if bold else (40, 40, 50))
                y += 18 * u
            y += 10 * u
    elif k == "call":
        status()
        d.text((sw / 2, sh * 0.25), content["contact"], font=font(int(24 * u)), fill=(255, 255, 255), anchor="mm")
        d.text((sw / 2, sh * 0.31), content.get("status", "Anruf…"), font=font(int(13 * u), False), fill=(200, 200, 210), anchor="mm")
    elif k == "text":
        status()
        lines = content["lines"]
        y = sh * 0.4
        for txt, col, size in lines:
            d.text((sw / 2, y), txt, font=font(int(size * u)), fill=col, anchor="mm")
            y += size * u * 1.5
    return scr


def hands_phone(img, pw, ph, cx, by, t, content, d_total, world, box, tilt=0.0):
    """Draw sleeves + hands holding a phone whose screen shows `content`."""
    d = ImageDraw.Draw(img)
    x0, y0 = cx - pw / 2, by - ph
    # sleeves from bottom corners
    poly(d, [(cx - pw * 1.2, H + 10), (cx - pw * 0.72, by - ph * 0.18), (cx - pw * 0.35, by - ph * 0.06), (cx - pw * 0.45, H + 10)], SLEEVE)
    poly(d, [(cx + pw * 1.25, H + 10), (cx + pw * 0.78, by - ph * 0.22), (cx + pw * 0.4, by - ph * 0.1), (cx + pw * 0.5, H + 10)], rgb(SLEEVE, 0.85))
    # phone body
    d.rounded_rectangle((x0 - 8, y0 - 8, x0 + pw + 8, by + 8), radius=int(pw * 0.12), fill=(25, 25, 30), outline=OUT, width=5)
    sw, sh = int(pw), int(ph)
    scr = _screen(content, sw, sh, t, d_total, world, box)
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw - 1, sh - 1), radius=int(pw * 0.09), fill=255)
    img.paste(scr, (int(x0), int(y0)), mask)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((cx - pw * 0.15, y0 + 6, cx + pw * 0.15, y0 + 20), radius=7, fill=(10, 10, 12))
    # left hand: fingers wrapping the left edge
    poly(d, [(x0 - 30, by - ph * 0.30), (x0 + pw * 0.08, by - ph * 0.33), (x0 + pw * 0.1, by - ph * 0.02), (x0 - pw * 0.25, by + ph * 0.08), (x0 - pw * 0.3, by - ph * 0.12)], SKIN)
    for i in range(3):
        yy = by - ph * (0.28 - i * 0.08)
        ellipse(d, x0 + pw * 0.07, yy, pw * 0.06, ph * 0.035, SKIN, width=4)
    # right hand + thumb
    poly(d, [(x0 + pw + 34, by - ph * 0.26), (x0 + pw * 0.92, by - ph * 0.28), (x0 + pw * 0.9, by), (x0 + pw * 1.28, by + ph * 0.1), (x0 + pw * 1.34, by - ph * 0.1)], rgb(SKIN, 0.92))
    tx = x0 + pw * (0.62 + 0.03 * ((t * 0.7) % 1 > 0.5))
    poly(d, [(x0 + pw * 0.95, by - ph * 0.2), (tx, by - ph * 0.27), (tx - pw * 0.06, by - ph * 0.22), (x0 + pw * 0.93, by - ph * 0.1)], rgb(SKIN, 0.95))


def overlay(img, sh, t, d_total, world, box):
    img = img.copy()
    mode = sh.pov
    content = sh.phone
    if mode == "phone":
        hands_phone(img, 330, 600, W / 2, H - 70, t, content, d_total, world, box)
    elif mode == "phone_up":  # phone raised (filming): smaller, higher
        hands_phone(img, 300, 540, W / 2 + 20, H - 150, t, content, d_total, world, box)
    elif mode == "phone_full":
        hands_phone(img, 560, 1010, W / 2, H - 70, t, content, d_total, world, box)
    elif mode == "hands_desk":
        d = ImageDraw.Draw(img)
        poly(d, [(-20, H + 10), (170, H - 210), (300, H - 180), (200, H + 10)], SLEEVE)
        ellipse(d, 290, H - 200, 60, 40, SKIN)
        poly(d, [(W + 20, H + 10), (W - 170, H - 230), (W - 300, H - 200), (W - 200, H + 10)], rgb(SLEEVE, 0.85))
        ellipse(d, W - 290, H - 218, 60, 40, rgb(SKIN, 0.95))
    elif mode == "hand_reach":
        d = ImageDraw.Draw(img)
        k = ease(min(1, t / 0.6))
        tipx, tipy = W * 0.6, H * (1.05 - 0.3 * k)
        poly(d, [(W * 0.85, H + 20), (tipx + 40, tipy + 30), (tipx - 40, tipy + 10), (W * 0.55, H + 20)], SLEEVE)
        ellipse(d, tipx, tipy - 10, 44, 36, SKIN)
        for i in range(4):
            ellipse(d, tipx - 36 + i * 24, tipy - 48, 12, 22, SKIN, width=4)
    elif mode == "arms_push":
        d = ImageDraw.Draw(img)
        poly(d, [(-30, H + 10), (W * 0.28, H * 0.62), (W * 0.4, H * 0.66), (W * 0.25, H + 10)], SLEEVE)
        ellipse(d, W * 0.36, H * 0.62, 60, 46, SKIN)
        poly(d, [(W + 30, H + 10), (W * 0.72, H * 0.63), (W * 0.6, H * 0.67), (W * 0.75, H + 10)], rgb(SLEEVE, 0.85))
        ellipse(d, W * 0.64, H * 0.63, 60, 46, rgb(SKIN, 0.95))
    return img
