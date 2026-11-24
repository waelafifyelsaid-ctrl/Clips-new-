"""Background illustrations (world size WW x WH). Each function returns a fresh RGB image."""
import math
import random

from PIL import Image, ImageDraw, ImageFilter

from gfx import (WW, WH, OUT, poly, rect, ellipse, line, rgb, mix, vgradient, vignette, glow, tint, room,
                 side_quad, lerp, font, text_outline)

R = random.Random(3)


# ------------------------------------------------------------------ shared pieces
def window(d, x0, y0, x1, y1, sky=(120, 160, 210), frame=(235, 230, 220), cross=True, lit=False):
    rect(d, x0, y0, x1, y1, frame)
    inner = (x0 + 10, y0 + 10, x1 - 10, y1 - 10)
    rect(d, *inner, (255, 214, 120) if lit else sky, width=4)
    if cross:
        line(d, [((x0 + x1) / 2, y0 + 10), ((x0 + x1) / 2, y1 - 10)], fill=frame, width=8)
        line(d, [(x0 + 10, (y0 + y1) / 2), (x1 - 10, (y0 + y1) / 2)], fill=frame, width=8)


def tree(d, x, y, s=1.0, c=(86, 140, 130)):
    poly(d, [(x - 10 * s, y), (x + 10 * s, y), (x + 8 * s, y - 120 * s), (x - 8 * s, y - 120 * s)], (90, 70, 60))
    for (ox, oy, r) in [(-50, -150, 60), (40, -160, 65), (0, -210, 70), (-20, -120, 55), (45, -110, 50)]:
        ellipse(d, x + ox * s, y + oy * s, r * s, r * s * 0.9, c)
    for (ox, oy, r) in [(-30, -170, 25), (30, -200, 22)]:
        ellipse(d, x + ox * s, y + oy * s, r * s, r * s * 0.8, rgb(c, 1.15), outline=None, width=0)


def car(d, x, y, s=1.0, c=(180, 90, 100), facing=1):
    # simple side-ish 3/4 car
    poly(d, [(x - 150 * s, y), (x + 150 * s, y), (x + 150 * s, y - 60 * s), (x + 90 * s, y - 70 * s), (x + 50 * s, y - 120 * s),
             (x - 80 * s, y - 120 * s), (x - 120 * s, y - 70 * s), (x - 150 * s, y - 60 * s)], c)
    poly(d, [(x - 70 * s, y - 112 * s), (x + 42 * s, y - 112 * s), (x + 75 * s, y - 72 * s), (x - 105 * s, y - 72 * s)], (150, 180, 200), width=4)
    line(d, [(x - 15 * s, y - 112 * s), (x - 15 * s, y - 72 * s)], width=4)
    for wx in (-90, 90):
        ellipse(d, x + wx * s, y, 34 * s, 34 * s, (40, 40, 46))
        ellipse(d, x + wx * s, y, 14 * s, 14 * s, (170, 170, 180), width=3)


def building_row(d, y_base, height, colors, x_from=-20, x_to=WW + 20, lit_p=0.4, night=False):
    x = x_from
    i = 0
    while x < x_to:
        w = R.randint(200, 280)
        c = colors[i % len(colors)]
        top = y_base - height - R.randint(-40, 60)
        rect(d, x, top, x + w, y_base, c)
        line(d, [(x, top + 30), (x + w, top + 30)], width=3, fill=rgb(c, 0.7))
        for wy in range(int(top + 60), int(y_base - 80), 110):
            for wx in range(int(x + 25), int(x + w - 50), 70):
                lit = R.random() < lit_p
                sky = (40, 50, 80) if night else (110, 140, 180)
                window(d, wx, wy, wx + 44, wy + 72, sky=sky, frame=rgb(c, 1.25), cross=False, lit=lit)
        x += w
        i += 1


# ------------------------------------------------------------------ scenes
def black():
    return Image.new("RGB", (WW, WH), (0, 0, 0))


def red_corridor():
    img = Image.new("RGB", (WW, WH), (20, 5, 8))
    d = ImageDraw.Draw(img)
    back = (WW * 0.38, WH * 0.36, WW * 0.62, WH * 0.58)
    room(d, None, back, (45, 12, 16), (60, 14, 20), (52, 12, 18), (25, 6, 9), (12, 2, 4))
    # lockers on the left
    for i in range(6):
        t0, t1 = i / 6, (i + 0.9) / 6
        poly(d, side_quad(back[0], back[1], back[3], 0, 0, WH, t0, t1, 0.35, 0.8), (90, 25, 30), width=3)
    for (t, v) in [(0.2, 0.05), (0.6, 0.05)]:
        q = side_quad(back[2], back[1], back[3], WW, 0, WH, t, t + 0.12, v, v + 0.06)
        poly(d, q, (255, 60, 50), width=3)
    img = glow(img, WW * 0.75, WH * 0.12, 200, (255, 40, 40), 0.5)
    return vignette(img, 0.8)


def bedroom():
    """POV lying in bed, looking at the nightstand side; morning light."""
    img = Image.new("RGB", (WW, WH))
    vgradient(img, (0, 0, WW, WH), (200, 190, 210), (150, 140, 170))
    d = ImageDraw.Draw(img)
    # wall poster and window
    window(d, WW * 0.52, WH * 0.08, WW * 0.95, WH * 0.36, sky=(250, 200, 160))
    rect(d, WW * 0.08, WH * 0.1, WW * 0.38, WH * 0.32, (60, 70, 110))
    text_outline(d, (WW * 0.23, WH * 0.21), "400m", 46, fill=(255, 210, 80), sw=3)
    # nightstand
    poly(d, [(WW * 0.05, WH * 0.55), (WW * 0.55, WH * 0.55), (WW * 0.6, WH * 0.62), (WW * 0.6, WH * 0.9), (0, WH * 0.9), (0, WH * 0.62)], (150, 105, 80))
    poly(d, [(WW * 0.05, WH * 0.55), (WW * 0.55, WH * 0.55), (WW * 0.6, WH * 0.62), (0, WH * 0.62)], (180, 130, 100))
    # lamp + glass
    poly(d, [(WW * 0.12, WH * 0.58), (WW * 0.2, WH * 0.58), (WW * 0.17, WH * 0.45), (WW * 0.15, WH * 0.45)], (80, 80, 90))
    poly(d, [(WW * 0.07, WH * 0.45), (WW * 0.25, WH * 0.45), (WW * 0.21, WH * 0.36), (WW * 0.11, WH * 0.36)], (240, 220, 160))
    rect(d, WW * 0.36, WH * 0.5, WW * 0.42, WH * 0.585, (200, 220, 240))
    # blanket at the bottom
    poly(d, [(0, WH * 0.78), (WW * 0.4, WH * 0.72), (WW, WH * 0.76), (WW, WH), (0, WH)], (90, 120, 160))
    line(d, [(WW * 0.2, WH * 0.85), (WW * 0.5, WH * 0.8), (WW * 0.8, WH * 0.86)], width=4, fill=(60, 85, 120))
    img = glow(img, WW * 0.74, WH * 0.22, 260, (255, 220, 170), 0.35)
    return vignette(img, 0.4)


def kitchen():
    img = Image.new("RGB", (WW, WH))
    d = ImageDraw.Draw(img)
    back = (WW * 0.12, WH * 0.18, WW * 0.88, WH * 0.6)
    room(d, None, back, (190, 160, 130), (226, 214, 190), (210, 198, 176), (240, 235, 225), (232, 222, 200))
    window(d, WW * 0.42, WH * 0.22, WW * 0.84, WH * 0.44, sky=(190, 200, 215))
    # counter
    rect(d, back[0], WH * 0.47, back[2], WH * 0.6, (120, 150, 150))
    rect(d, back[0], WH * 0.46, back[2], WH * 0.48, (230, 230, 225), width=3)
    # radio
    rect(d, WW * 0.18, WH * 0.4, WW * 0.32, WH * 0.46, (170, 60, 50), r=10)
    ellipse(d, WW * 0.22, WH * 0.43, 18, 18, (60, 30, 30))
    # table in foreground
    poly(d, [(-20, WH * 0.78), (WW + 20, WH * 0.78), (WW + 20, WH), (-20, WH)], (175, 125, 90))
    line(d, [(-20, WH * 0.78), (WW + 20, WH * 0.78)], width=5)
    ellipse(d, WW * 0.5, WH * 0.87, 150, 45, (245, 245, 245))
    poly(d, [(WW * 0.42, WH * 0.86), (WW * 0.58, WH * 0.86), (WW * 0.56, WH * 0.83), (WW * 0.44, WH * 0.83)], (220, 170, 100), width=4)
    rect(d, WW * 0.72, WH * 0.8, WW * 0.8, WH * 0.88, (240, 240, 240), r=8)
    return vignette(img, 0.35)


def street_morning(night=False):
    img = Image.new("RGB", (WW, WH))
    sky_top, sky_bot = ((110, 130, 170), (230, 190, 170)) if not night else ((20, 25, 45), (60, 50, 80))
    vgradient(img, (0, 0, WW, WH * 0.5), sky_top, sky_bot)
    d = ImageDraw.Draw(img)
    building_row(d, WH * 0.56, 420, [(184, 120, 110), (170, 140, 120), (150, 110, 120)], night=night, lit_p=0.15)
    # sidewalk + road in perspective
    poly(d, [(-50, WH), (WW * 0.45, WH * 0.56), (WW * 0.55, WH * 0.56), (WW + 50, WH)], (120, 120, 130), width=0)
    poly(d, [(-50, WH), (WW * 0.45, WH * 0.56), (WW * 0.3, WH * 0.56), (-300, WH)], (175, 165, 160), width=0)
    line(d, [(WW * 0.5, WH * 0.58), (WW * 0.5, WH * 0.62)], fill=(240, 240, 240), width=6)
    line(d, [(WW * 0.5, WH * 0.67), (WW * 0.5, WH * 0.76)], fill=(240, 240, 240), width=9)
    line(d, [(WW * 0.5, WH * 0.84), (WW * 0.5, WH * 1.0)], fill=(240, 240, 240), width=13)
    tree(d, WW * 0.12, WH * 0.75, 1.1)
    tree(d, WW * 0.85, WH * 0.72, 1.0)
    car(d, WW * 0.78, WH * 0.66, 0.7, (120, 140, 170))
    img = vignette(img, 0.35)
    if night:
        img = tint(img, (20, 30, 70), 0.3)
    return img


def school_front(ambulance=True, night=False):
    img = Image.new("RGB", (WW, WH))
    vgradient(img, (0, 0, WW, WH * 0.4), (120, 140, 180), (210, 200, 200))
    d = ImageDraw.Draw(img)
    # school building (70s style)
    rect(d, -20, WH * 0.12, WW + 20, WH * 0.5, (196, 160, 130))
    for row in range(3):
        for col in range(6):
            x = 20 + col * 140
            y = WH * 0.15 + row * 120
            window(d, x, y, x + 110, y + 85, sky=(120, 150, 190), frame=(230, 225, 215))
    rect(d, WW * 0.36, WH * 0.4, WW * 0.64, WH * 0.5, (110, 90, 80))
    rect(d, WW * 0.25, WH * 0.355, WW * 0.75, WH * 0.395, (60, 70, 90))
    text_outline(d, (WW / 2, WH * 0.375), "LINDENHOF-GESAMTSCHULE", 28, fill=(255, 255, 255), sw=0)
    # fence + yard
    rect(d, -20, WH * 0.5, WW + 20, WH, (150, 145, 140), width=0)
    for x in range(0, WW, 34):
        line(d, [(x, WH * 0.47), (x, WH * 0.54)], width=4, fill=(60, 70, 70))
    line(d, [(0, WH * 0.48), (WW, WH * 0.48)], width=5, fill=(60, 70, 70))
    line(d, [(0, WH * 0.535), (WW, WH * 0.535)], width=5, fill=(60, 70, 70))
    # street in front
    poly(d, [(-20, WH * 0.6), (WW + 20, WH * 0.6), (WW + 20, WH), (-20, WH)], (110, 112, 120), width=0)
    line(d, [(0, WH * 0.6), (WW, WH * 0.6)], width=5)
    for x in range(0, WW, 160):
        rect(d, x + 20, WH * 0.79, x + 100, WH * 0.8, (230, 230, 230), width=0)
    tree(d, WW * 0.08, WH * 0.58, 0.9)
    if ambulance:
        ambulance_draw(d, WW * 0.55, WH * 0.74)
    img = vignette(img, 0.35)
    if night:
        img = tint(img, (20, 30, 70), 0.45)
    return img


def ambulance_draw(d, x, y, s=1.0, light_on=True):
    poly(d, [(x - 230 * s, y), (x + 200 * s, y), (x + 200 * s, y - 240 * s), (x - 230 * s, y - 240 * s)], (245, 245, 240))
    poly(d, [(x + 200 * s, y), (x + 300 * s, y), (x + 300 * s, y - 120 * s), (x + 250 * s, y - 170 * s), (x + 200 * s, y - 170 * s)], (245, 245, 240))
    poly(d, [(x + 210 * s, y - 120 * s), (x + 285 * s, y - 120 * s), (x + 248 * s, y - 160 * s), (x + 210 * s, y - 160 * s)], (150, 180, 200), width=4)
    rect(d, x - 230 * s, y - 120 * s, x + 300 * s, y - 95 * s, (230, 60, 40), width=3)
    rect(d, x - 60 * s, y - 200 * s, x + 10 * s, y - 130 * s, (230, 60, 40), width=0)
    rect(d, x - 95 * s, y - 175 * s, x + 45 * s, y - 155 * s, (230, 60, 40), width=0)
    rect(d, x - 120 * s, y - 262 * s, x - 60 * s, y - 240 * s, (60, 120, 255) if light_on else (40, 60, 120), width=3)
    rect(d, x + 60 * s, y - 262 * s, x + 120 * s, y - 240 * s, (60, 120, 255) if light_on else (40, 60, 120), width=3)
    for wx in (-150, 230):
        ellipse(d, x + wx * s, y, 40 * s, 40 * s, (40, 40, 46))
        ellipse(d, x + wx * s, y, 16 * s, 16 * s, (170, 170, 180), width=3)
    line(d, [(x - 230 * s, y - 240 * s), (x - 230 * s, y)], width=5)


def stretcher(d, x, y, s=1.0, badge=False):
    rect(d, x - 150 * s, y - 20 * s, x + 150 * s, y, (190, 190, 200))
    for wx in (-120, 120):
        line(d, [(x + wx * s, y), (x + wx * s, y + 60 * s)], width=6)
        ellipse(d, x + wx * s, y + 66 * s, 10 * s, 10 * s, (40, 40, 40))
    # body under blanket
    poly(d, [(x - 150 * s, y - 20 * s), (x + 110 * s, y - 20 * s), (x + 120 * s, y - 60 * s), (x - 20 * s, y - 75 * s), (x - 140 * s, y - 55 * s)], (120, 150, 200))
    ellipse(d, x + 135 * s, y - 50 * s, 30 * s, 26 * s, (230, 200, 180))
    for gx in (-100, -30, 40, 100):
        line(d, [(x + gx * s, y - 72 * s), (x + gx * s, y - 18 * s)], width=int(9 * s), fill=(30, 30, 30))
    if badge:
        rect(d, x + 30 * s, y - 70 * s, x + 75 * s, y - 50 * s, (255, 255, 255), width=2)


def hallway(poster=True, dark=False):
    img = Image.new("RGB", (WW, WH))
    d = ImageDraw.Draw(img)
    back = (WW * 0.3, WH * 0.3, WW * 0.7, WH * 0.56)
    room(d, None, back, (165, 160, 150), (205, 200, 185), (190, 185, 172), (220, 220, 215), (180, 175, 165))
    # windows right wall
    for i in range(3):
        q = side_quad(back[2], back[1], back[3], WW, 0, WH, 0.15 + i * 0.28, 0.33 + i * 0.28, 0.2, 0.55)
        poly(d, q, (150, 185, 220), width=4)
    # lockers left
    for i in range(7):
        q = side_quad(back[0], back[1], back[3], 0, 0, WH, i / 7, (i + 0.92) / 7, 0.35, 0.82)
        poly(d, q, (90, 130, 150), width=3)
    # door at the back
    rect(d, WW * 0.44, WH * 0.4, WW * 0.56, WH * 0.56, (130, 100, 80))
    # ceiling lights
    for t in (0.2, 0.5, 0.8):
        y = lerp(back[1], -40, t)
        x0 = lerp(back[0] + 40, WW * 0.2, t)
        x1 = lerp(back[2] - 40, WW * 0.8, t)
        poly(d, [(x0, y), (x1, y), (x1, y + 10 + 20 * t), (x0, y + 10 + 20 * t)], (250, 250, 230), width=2)
    if poster:
        q = side_quad(back[0], back[1], back[3], 0, 0, WH, 0.42, 0.68, 0.12, 0.3)
        poly(d, q, (250, 245, 220), width=4)
    img = vignette(img, 0.45)
    if dark:
        img = tint(img, (10, 10, 30), 0.5)
    return img


def poster_closeup():
    img = Image.new("RGB", (WW, WH), (205, 200, 185))
    d = ImageDraw.Draw(img)
    rect(d, WW * 0.08, WH * 0.25, WW * 0.92, WH * 0.72, (250, 245, 220), width=6)
    text_outline(d, (WW / 2, WH * 0.33), "DANKE!", 80, fill=(220, 60, 60), sw=0)
    for i, ln in enumerate(["für eure Teilnahme", "an der IMPFAKTION"]):
        text_outline(d, (WW / 2, WH * 0.42 + i * 60), ln, 44, fill=(40, 40, 60), sw=0)
    # little syringe icon
    poly(d, [(WW * 0.35, WH * 0.56), (WW * 0.6, WH * 0.56), (WW * 0.6, WH * 0.58), (WW * 0.35, WH * 0.58)], (120, 180, 220), width=3)
    line(d, [(WW * 0.6, WH * 0.57), (WW * 0.68, WH * 0.57)], width=3)
    text_outline(d, (WW / 2, WH * 0.65), "Lindenhof-Gesamtschule  &  HELIX BIOTECH", 26, fill=(90, 90, 110), sw=0)
    return vignette(img, 0.4)


def classroom(blinds=False, dark=False, view="window"):
    """POV from a desk: board at the back, window wall right."""
    img = Image.new("RGB", (WW, WH))
    d = ImageDraw.Draw(img)
    back = (WW * 0.1, WH * 0.2, WW * 0.84, WH * 0.52)
    room(d, None, back, (170, 150, 125), (225, 215, 195), (210, 200, 182), (235, 232, 225), (220, 212, 195))
    # board
    rect(d, WW * 0.22, WH * 0.27, WW * 0.72, WH * 0.42, (50, 80, 70))
    d.text((WW * 0.28, WH * 0.31), "Zellteilung  -  Mitose", font=font(26, False), fill=(235, 235, 235))
    line(d, [(WW * 0.3, WH * 0.37), (WW * 0.5, WH * 0.37)], fill=(235, 235, 235), width=2)
    # windows on right wall
    for i in range(2):
        q = side_quad(back[2], back[1], back[3], WW, 0, WH * 0.95, 0.12 + i * 0.42, 0.45 + i * 0.42, 0.12, 0.6)
        poly(d, q, (150, 185, 220) if not blinds else (200, 195, 170), width=5)
        if blinds:
            for v in range(12):
                vv = 0.12 + v * 0.04
                qq = side_quad(back[2], back[1], back[3], WW, 0, WH * 0.95, 0.12 + i * 0.42, 0.45 + i * 0.42, vv, vv + 0.005)
                poly(d, qq, (150, 140, 120), width=0)
    # desks rows in perspective
    for row, (y, s) in enumerate([(WH * 0.58, 0.5), (WH * 0.68, 0.75)]):
        for xx in (0.3, 0.62):
            x = WW * xx
            poly(d, [(x - 130 * s, y), (x + 130 * s, y), (x + 150 * s, y + 40 * s), (x - 150 * s, y + 40 * s)], (200, 170, 120), width=4)
    # own desk foreground
    poly(d, [(-30, WH * 0.82), (WW + 30, WH * 0.82), (WW + 30, WH), (-30, WH)], (205, 175, 125))
    line(d, [(-30, WH * 0.82), (WW + 30, WH * 0.82)], width=6)
    rect(d, WW * 0.3, WH * 0.86, WW * 0.62, WH * 0.95, (245, 245, 240), width=3)
    for i in range(4):
        line(d, [(WW * 0.33, WH * (0.88 + i * 0.016)), (WW * 0.58, WH * (0.88 + i * 0.016))], fill=(160, 160, 200), width=2)
    img = vignette(img, 0.4)
    if dark:
        img = tint(img, (20, 20, 40), 0.35)
    return img


def window_view_ambulance(rock=0.0):
    """Looking down from the first floor at the street with the ambulance."""
    img = Image.new("RGB", (WW, WH), (130, 130, 140))
    d = ImageDraw.Draw(img)
    poly(d, [(-20, WH * 0.25), (WW + 20, WH * 0.25), (WW + 20, WH), (-20, WH)], (112, 114, 122), width=0)
    rect(d, -20, -20, WW + 20, WH * 0.25, (175, 165, 160), width=0)
    for x in range(0, WW, 34):
        line(d, [(x, WH * 0.22), (x, WH * 0.3)], width=4, fill=(60, 70, 70))
    tree(d, WW * 0.85, WH * 0.3, 0.9)
    ambulance_draw(d, WW * 0.48 + rock * 12, WH * 0.62, 1.15)
    # window frame of the classroom
    img = vignette(img, 0.3)
    d = ImageDraw.Draw(img)
    rect(d, -20, -20, WW + 20, WH * 0.06, (230, 225, 215))
    rect(d, -20, WH * 0.88, WW + 20, WH + 20, (230, 225, 215))
    rect(d, -20, -20, WW * 0.05, WH + 20, (230, 225, 215))
    rect(d, WW * 0.95, -20, WW + 20, WH + 20, (230, 225, 215))
    line(d, [(WW * 0.5, 0), (WW * 0.5, WH)], fill=(230, 225, 215), width=14)
    return img


def blinds_closed():
    img = Image.new("RGB", (WW, WH), (200, 195, 170))
    d = ImageDraw.Draw(img)
    for y in range(0, WH, 60):
        rect(d, -10, y, WW + 10, y + 50, (215, 210, 185), width=3)
    return vignette(img, 0.5)


def bedroom_night():
    img = Image.new("RGB", (WW, WH))
    vgradient(img, (0, 0, WW, WH), (25, 25, 45), (15, 15, 30))
    d = ImageDraw.Draw(img)
    window(d, WW * 0.2, WH * 0.12, WW * 0.8, WH * 0.58, sky=(30, 35, 60), frame=(70, 70, 95))
    return vignette(img, 0.5)


def window_night_street(man=True):
    """View from Jonas' window at night: streetlamp across the street."""
    img = Image.new("RGB", (WW, WH))
    vgradient(img, (0, 0, WW, WH), (15, 18, 35), (35, 35, 55))
    d = ImageDraw.Draw(img)
    building_row(d, WH * 0.55, 420, [(60, 55, 75), (50, 50, 70)], night=True, lit_p=0.1)
    poly(d, [(-20, WH * 0.55), (WW + 20, WH * 0.55), (WW + 20, WH), (-20, WH)], (45, 45, 58), width=0)
    # lamp
    lx, ly = WW * 0.5, WH * 0.72
    line(d, [(lx, ly), (lx, WH * 0.36)], width=10, fill=(30, 30, 36))
    line(d, [(lx, WH * 0.36), (lx + 70, WH * 0.34)], width=8, fill=(30, 30, 36))
    poly(d, [(lx + 50, WH * 0.34), (lx + 110, WH * 0.34), (lx + 100, WH * 0.36), (lx + 60, WH * 0.36)], (255, 230, 160), width=3)
    img = glow(img, lx + 80, WH * 0.55, 260, (255, 220, 140), 0.38)
    img = vignette(img, 0.6)
    d = ImageDraw.Draw(img)
    # window frame
    rect(d, -20, -20, WW + 20, WH * 0.05, (60, 60, 80))
    rect(d, -20, WH * 0.9, WW + 20, WH + 20, (60, 60, 80))
    line(d, [(WW * 0.5, 0), (WW * 0.5, WH)], fill=(60, 60, 80), width=14)
    return img


def cafeteria():
    img = Image.new("RGB", (WW, WH))
    d = ImageDraw.Draw(img)
    back = (WW * 0.08, WH * 0.22, WW * 0.92, WH * 0.52)
    room(d, None, back, (180, 170, 150), (230, 210, 170), (215, 195, 160), (240, 235, 225), (225, 205, 165))
    # glass door at back center
    rect(d, WW * 0.4, WH * 0.3, WW * 0.6, WH * 0.52, (160, 200, 215))
    line(d, [(WW * 0.5, WH * 0.3), (WW * 0.5, WH * 0.52)], width=5)
    # food counter left
    poly(d, side_quad(back[0], back[1], back[3], 0, 0, WH, 0.1, 0.7, 0.55, 0.8), (160, 170, 175), width=4)
    # tables
    for (x, y, s) in [(0.3, 0.6, 0.6), (0.72, 0.6, 0.6)]:
        ellipse(d, WW * x, WH * y, 150 * s, 40 * s, (230, 225, 215))
    # own table foreground
    poly(d, [(-30, WH * 0.8), (WW + 30, WH * 0.8), (WW + 30, WH), (-30, WH)], (210, 200, 185))
    line(d, [(-30, WH * 0.8), (WW + 30, WH * 0.8)], width=6)
    # tray with pasta
    poly(d, [(WW * 0.25, WH * 0.84), (WW * 0.75, WH * 0.84), (WW * 0.8, WH * 0.98), (WW * 0.2, WH * 0.98)], (200, 100, 80))
    ellipse(d, WW * 0.5, WH * 0.9, 140, 50, (245, 245, 245))
    ellipse(d, WW * 0.5, WH * 0.9, 100, 32, (235, 190, 90), width=3)
    return vignette(img, 0.35)


def glass_door_hand():
    img = Image.new("RGB", (WW, WH))
    vgradient(img, (0, 0, WW, WH), (140, 175, 190), (110, 140, 160))
    d = ImageDraw.Draw(img)
    rect(d, WW * 0.05, -20, WW * 0.95, WH + 20, None if False else (150, 185, 200), width=14)
    # bloody hand print
    cx, cy = WW * 0.5, WH * 0.45
    col = (150, 20, 25)
    ellipse(d, cx, cy, 90, 100, col, outline=None, width=0)
    for i, (ox, l) in enumerate([(-75, 120), (-30, 160), (15, 165), (60, 140)]):
        poly(d, [(cx + ox - 16, cy - 60), (cx + ox + 16, cy - 60), (cx + ox + 14, cy - 60 - l), (cx + ox - 14, cy - 60 - l)], col, width=0)
    poly(d, [(cx + 80, cy), (cx + 170, cy - 60), (cx + 180, cy - 30), (cx + 90, cy + 40)], col, width=0)
    for k in range(5):
        y0 = cy + 90
        line(d, [(cx - 50 + k * 25, y0), (cx - 50 + k * 25, y0 + R.randint(80, 260))], fill=col, width=8)
    return vignette(img, 0.5)


def glass_door_view(berger=True):
    """Through the cafeteria glass door: hallway with stairs left (cellar) and right (office)."""
    img = Image.new("RGB", (WW, WH))
    d = ImageDraw.Draw(img)
    back = (WW * 0.3, WH * 0.3, WW * 0.7, WH * 0.6)
    room(d, None, back, (160, 155, 145), (200, 195, 180), (190, 185, 172), (215, 215, 210), (180, 175, 165))
    # sign arrows
    rect(d, WW * 0.06, WH * 0.32, WW * 0.28, WH * 0.37, (60, 90, 140))
    d.text((WW * 0.17, WH * 0.345), "◄ KELLER", font=font(24), fill=(255, 255, 255), anchor="mm")
    rect(d, WW * 0.72, WH * 0.32, WW * 0.96, WH * 0.37, (60, 90, 140))
    d.text((WW * 0.84, WH * 0.345), "SEKRETARIAT ►", font=font(22), fill=(255, 255, 255), anchor="mm")
    # cellar stair opening left
    poly(d, side_quad(back[0], back[1], back[3], 0, 0, WH, 0.3, 0.6, 0.35, 1.0), (40, 35, 40), width=4)
    img = vignette(img, 0.4)
    d = ImageDraw.Draw(img)
    # glass door frame + reflection
    rect(d, -20, -20, WW * 0.08, WH + 20, (90, 100, 110))
    rect(d, WW * 0.92, -20, WW + 20, WH + 20, (90, 100, 110))
    rect(d, -20, WH * 0.48, WW + 20, WH * 0.5, (90, 100, 110))
    img = Image.blend(img, Image.new("RGB", img.size, (170, 210, 225)), 0.12)
    return img


def mathroom(door_focus=False):
    img = classroom()
    if door_focus:
        return door_closeup()
    return img


def door_closeup(handle_down=0.0, dark=False):
    img = Image.new("RGB", (WW, WH), (215, 205, 188))
    d = ImageDraw.Draw(img)
    rect(d, WW * 0.18, WH * 0.12, WW * 0.82, WH + 20, (150, 112, 80))
    rect(d, WW * 0.18, WH * 0.12, WW * 0.82, WH + 20, None, width=0)
    rect(d, WW * 0.3, WH * 0.2, WW * 0.7, WH * 0.42, (180, 200, 210))  # small window
    line(d, [(WW * 0.5, WH * 0.2), (WW * 0.5, WH * 0.42)], width=4)
    # handle
    hx, hy = WW * 0.72, WH * 0.58
    rect(d, hx - 18, hy - 50, hx + 18, hy + 50, (190, 190, 195), r=8)
    ang = math.radians(10 + 35 * handle_down)
    line(d, [(hx, hy - 20), (hx - 110 * math.cos(ang), hy - 20 + 110 * math.sin(ang))], fill=(200, 200, 205), width=22)
    line(d, [(hx, hy - 20), (hx - 110 * math.cos(ang), hy - 20 + 110 * math.sin(ang))], fill=OUT, width=4)
    ellipse(d, hx, hy + 30, 8, 12, (40, 40, 45))
    img = vignette(img, 0.6)
    if dark:
        img = tint(img, (10, 10, 20), 0.35)
    return img


def fence_view():
    """From the classroom window: school fence, street, police car."""
    img = Image.new("RGB", (WW, WH))
    vgradient(img, (0, 0, WW, WH), (150, 150, 160), (120, 125, 135))
    d = ImageDraw.Draw(img)
    rect(d, -20, WH * 0.45, WW + 20, WH, (112, 114, 122), width=0)
    rect(d, -20, -20, WW + 20, WH * 0.45, (150, 150, 140), width=0)
    tree(d, WW * 0.15, WH * 0.42, 1.0)
    tree(d, WW * 0.9, WH * 0.42, 0.9)
    # fence
    for x in range(0, WW, 30):
        line(d, [(x, WH * 0.32), (x, WH * 0.47)], width=4, fill=(60, 70, 70))
    line(d, [(0, WH * 0.33), (WW, WH * 0.33)], width=5, fill=(60, 70, 70))
    line(d, [(0, WH * 0.46), (WW, WH * 0.46)], width=5, fill=(60, 70, 70))
    # police car
    car(d, WW * 0.75, WH * 0.72, 0.9, (235, 235, 240))
    rect(d, WW * 0.75 - 110, WH * 0.72 - 60, WW * 0.75 + 130, WH * 0.72 - 40, (40, 120, 80), width=3)
    rect(d, WW * 0.75 - 40, WH * 0.72 - 132, WW * 0.75 + 20, WH * 0.72 - 116, (60, 120, 255), width=3)
    img = vignette(img, 0.4)
    d = ImageDraw.Draw(img)
    rect(d, -20, -20, WW + 20, WH * 0.05, (230, 225, 215))
    rect(d, -20, WH * 0.92, WW + 20, WH + 20, (230, 225, 215))
    return img


def parents_crowd():
    img = school_front(ambulance=False)
    img = tint(img, (240, 150, 80), 0.18)  # evening
    d = ImageDraw.Draw(img)
    # police tape
    line(d, [(0, WH * 0.62), (WW, WH * 0.58)], fill=(240, 220, 40), width=14)
    for x in range(0, WW, 70):
        line(d, [(x, WH * 0.62 - x * 0.04 / WW * WH * 0.0), (x + 30, WH * 0.62 - (x + 30) / WW * WH * 0.04)], fill=(30, 30, 30), width=14)
    # blue lights
    img = glow(img, WW * 0.85, WH * 0.6, 120, (60, 120, 255), 0.5)
    return img


def tv_newsroom():
    img = Image.new("RGB", (WW, WH), (20, 40, 80))
    return img


def shadow_wall(pose=0.0):
    """Classroom side wall with two struggling shadows (the attack, only implied)."""
    img = Image.new("RGB", (WW, WH), (215, 205, 185))
    d = ImageDraw.Draw(img)
    rect(d, -20, WH * 0.08, WW + 20, WH * 0.12, (180, 170, 150), width=3)
    rect(d, WW * 0.62, WH * 0.15, WW * 0.95, WH * 0.4, (60, 90, 80), width=5)  # map/board corner
    sh = (70, 60, 60)
    # standing figure (teacher) bending back
    x = WW * 0.38 + pose * 30
    ellipse(d, x, WH * 0.32 + pose * 40, 70, 80, sh, outline=None, width=0)
    poly(d, [(x - 120, WH * 0.42 + pose * 40), (x + 110, WH * 0.42 + pose * 40), (x + 150, WH * 1.05), (x - 160, WH * 1.05)], sh, outline=None, width=0)
    # attacker lunging in from the left
    ax = WW * 0.12 + pose * 80
    ellipse(d, ax + 110, WH * 0.36 + pose * 30, 66, 74, sh, outline=None, width=0)
    poly(d, [(ax - 100, WH * 0.5), (ax + 90, WH * 0.44), (ax + 120, WH * 1.05), (ax - 140, WH * 1.05)], sh, outline=None, width=0)
    poly(d, [(ax + 40, WH * 0.5), (x - 40, WH * 0.4), (x - 30, WH * 0.46), (ax + 50, WH * 0.58)], sh, outline=None, width=0)
    img = img.filter(ImageFilter.GaussianBlur(3))
    return vignette(img, 0.6)


def stretcher_closeup():
    """Zoomed still from Jonas' video: badge on the patient's chest."""
    img = Image.new("RGB", (WW, WH), (112, 114, 122))
    d = ImageDraw.Draw(img)
    poly(d, [(-20, WH * 0.3), (WW + 20, WH * 0.22), (WW + 20, WH * 0.8), (-20, WH * 0.85)], (120, 150, 200))
    for gx in (0.15, 0.55, 0.85):
        line(d, [(WW * gx, WH * 0.25), (WW * gx - 20, WH * 0.84)], width=26, fill=(30, 30, 30))
    rect(d, WW * 0.28, WH * 0.42, WW * 0.72, WH * 0.58, (255, 255, 255), width=6)
    rect(d, WW * 0.28, WH * 0.42, WW * 0.72, WH * 0.47, (40, 110, 90), width=0)
    text_outline(d, (WW * 0.5, WH * 0.445), "HELIX BIOTECH", 30, fill=(255, 255, 255), sw=0)
    text_outline(d, (WW * 0.5, WH * 0.505), "LABOR 4", 40, fill=(20, 20, 20), sw=0)
    text_outline(d, (WW * 0.5, WH * 0.55), "Zugang: Stufe 3", 22, fill=(90, 90, 90), sw=0)
    rect(d, WW * 0.5 - 6, WH * 0.33, WW * 0.5 + 6, WH * 0.42, (180, 40, 40), width=0)
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    return vignette(img, 0.5)


def classroom_floor():
    """Lower view: floor of the classroom, overturned chair (after the attack)."""
    img = classroom()
    d = ImageDraw.Draw(img)
    poly(d, [(WW * 0.6, WH * 0.64), (WW * 0.8, WH * 0.6), (WW * 0.82, WH * 0.66), (WW * 0.62, WH * 0.7)], (90, 90, 100))
    line(d, [(WW * 0.65, WH * 0.69), (WW * 0.6, WH * 0.78)], width=6)
    line(d, [(WW * 0.8, WH * 0.65), (WW * 0.86, WH * 0.74)], width=6)
    for (x, y) in [(0.3, 0.75), (0.5, 0.72), (0.4, 0.8)]:
        poly(d, [(WW * x, WH * y), (WW * x + 70, WH * y - 10), (WW * x + 80, WH * y + 30), (WW * x + 10, WH * y + 40)], (250, 250, 245), width=3)
    return img


def classroom_door_view():
    """From the desk towards the classroom door (front left)."""
    img = Image.new("RGB", (WW, WH))
    d = ImageDraw.Draw(img)
    back = (WW * 0.05, WH * 0.2, WW * 0.75, WH * 0.55)
    room(d, None, back, (170, 150, 125), (220, 210, 190), (205, 195, 178), (235, 232, 225), (225, 215, 196))
    rect(d, WW * 0.18, WH * 0.27, WW * 0.42, WH * 0.55, (150, 112, 80))
    rect(d, WW * 0.22, WH * 0.3, WW * 0.38, WH * 0.38, (180, 200, 210))
    rect(d, WW * 0.48, WH * 0.27, WW * 0.72, WH * 0.4, (50, 80, 70))
    poly(d, [(-30, WH * 0.84), (WW + 30, WH * 0.84), (WW + 30, WH), (-30, WH)], (205, 175, 125))
    line(d, [(-30, WH * 0.84), (WW + 30, WH * 0.84)], width=6)
    return vignette(img, 0.4)
