"""Drawing primitives for the 2D cel-shaded look: thick outlines, flat fills, one shade tone."""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 720, 1280          # output frame
SC = 1.15                 # world is bigger than the frame so the camera can move
WW, WH = int(W * SC), int(H * SC)
OUT = (18, 16, 22)        # outline colour
LW = 5                    # outline width

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_fonts = {}


def font(size, bold=True):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)
    return _fonts[key]


def rgb(c, k=1.0):
    """Scale a colour's brightness (k<1 darker)."""
    return tuple(max(0, min(255, int(v * k))) for v in c[:3])


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def poly(d, pts, fill, outline=OUT, width=LW):
    d.polygon(pts, fill=fill)
    if outline and width:
        d.line(list(pts) + [pts[0]], fill=outline, width=width, joint="curve")


def rect(d, x0, y0, x1, y1, fill, outline=OUT, width=LW, r=0):
    if r:
        d.rounded_rectangle((x0, y0, x1, y1), r, fill=fill, outline=outline if width else None, width=width)
    else:
        d.rectangle((x0, y0, x1, y1), fill=fill, outline=outline if width else None, width=width)


def ellipse(d, cx, cy, rx, ry, fill, outline=OUT, width=LW):
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=fill, outline=outline if width else None, width=width)


def line(d, pts, fill=OUT, width=LW):
    d.line(pts, fill=fill, width=width, joint="curve")


def vgradient(img, box, top, bottom):
    x0, y0, x1, y1 = [int(v) for v in box]
    d = ImageDraw.Draw(img)
    h = max(1, y1 - y0)
    for i in range(h):
        d.line([(x0, y0 + i), (x1, y0 + i)], fill=mix(top, bottom, i / h))


def new_world(color=(40, 40, 50)):
    return Image.new("RGB", (WW, WH), color)


def vignette(img, strength=0.55):
    """Darken the edges (applied to world images)."""
    w, h = img.size
    m = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(m)
    md.ellipse((-w * 0.25, -h * 0.12, w * 1.25, h * 1.12), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(w * 0.18))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    inv = m.point(lambda v: int(255 - (255 - v) * strength))
    return Image.composite(img, dark, inv)


def tint(img, color, alpha):
    layer = Image.new("RGB", img.size, color)
    return Image.blend(img, layer, alpha)


def glow(img, cx, cy, r, color, alpha=0.6):
    """Additive-looking soft light blob."""
    w, h = img.size
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).ellipse((cx - r, cy - r, cx + r, cy + r), fill=int(255 * alpha))
    m = m.filter(ImageFilter.GaussianBlur(r * 0.5))
    layer = Image.new("RGB", (w, h), color)
    return Image.composite(layer, img, m)


def text_outline(d, xy, txt, size, fill=(255, 255, 255), stroke=OUT, sw=4, anchor="mm", bold=True):
    d.text(xy, txt, font=font(size, bold), fill=fill, stroke_width=sw, stroke_fill=stroke, anchor=anchor)


# ---------------------------------------------------------------- perspective room helper
def room(d, vp, back, floor_c, wall_l, wall_r, ceil_c, back_c, size=(WW, WH)):
    """One-point perspective box. back = (x0,y0,x1,y1) back-wall rectangle."""
    w, h = size
    x0, y0, x1, y1 = back
    poly(d, [(0, 0), (w, 0), (x1, y0), (x0, y0)], ceil_c, width=0)
    poly(d, [(0, h), (w, h), (x1, y1), (x0, y1)], floor_c, width=0)
    poly(d, [(0, 0), (x0, y0), (x0, y1), (0, h)], wall_l, width=0)
    poly(d, [(w, 0), (x1, y0), (x1, y1), (w, h)], wall_r, width=0)
    d.rectangle(back, fill=back_c)
    for p in [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]:
        pass
    line(d, [(0, 0), (x0, y0)], width=3)
    line(d, [(w, 0), (x1, y0)], width=3)
    line(d, [(0, h), (x0, y1)], width=3)
    line(d, [(w, h), (x1, y1)], width=3)
    d.rectangle(back, outline=OUT, width=3)


def lerp(a, b, t):
    return a + (b - a) * t


def side_quad(back_edge_x, back_y0, back_y1, near_x, near_y0, near_y1, t0, t1, v0, v1):
    """Quad on a side wall: t along depth (0=back,1=near), v vertical fraction (0 top,1 bottom)."""
    def pt(t, v):
        x = lerp(back_edge_x, near_x, t)
        ytop = lerp(back_y0, near_y0, t)
        ybot = lerp(back_y1, near_y1, t)
        return (x, lerp(ytop, ybot, v))
    return [pt(t0, v0), pt(t1, v0), pt(t1, v1), pt(t0, v1)]


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)
