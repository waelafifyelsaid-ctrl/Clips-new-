"""TEIL 1 – Ein ganz normaler Montag"""
from PIL import ImageDraw

import scenes as S
from engine import Shot, Say, Pause, Sfx, Fx, Text, card
from gfx import WW, WH


def school_with_stretcher():
    img = S.school_front()
    d = ImageDraw.Draw(img)
    S.stretcher(d, WW * 0.34, WH * 0.8, 0.95, badge=True)
    return img


def rocking_ambulance(img, t, d):
    import math
    if t > 1.2:
        k = math.sin(t * 22) * max(0, 1 - (t - 1.2) / 3.5)
        return S.window_view_ambulance(rock=k)
    return img


NOTES = [
    ("Leon", "LEON", "bro steh auf", 0.4),
    ("Hallbrück-News", "Störfall bei Helix Biotech", "Laut Unternehmen keine Gefahr für Anwohner.", 1.4),
    ("Kalender", "Mathe-Test", "3. Stunde · Raum 2.14", 2.4),
]


def shots():
    return [
        # --- HOOK: flash-forward
        Shot(S.red_corridor, [Sfx("scream", 0.1, 0.6), Sfx("growl", 0.3, 0.9), Fx("shake", 0, 2.4, 1.5),
                              Say("JONAS", "Lauf!", speed=175), Pause(0.4), Fx("flash", 0, 0.25, 0.9), Pause(0.25)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.48, 1.12), shake=10), pov="hand_reach",
             chars=[dict(name="EMILIA", pos=(0.5, 0.52), r=70, back=True)], music="heart", tintc=((120, 0, 0), 0.25)),
        card("2 TAGE VORHER", 1.8, beats=[Sfx("hit", 0, 0.7), Pause(1.8)]),

        # --- Szene 1: Wecker
        Shot(S.bedroom, [Sfx("alarmclock", 0, 0.8), Pause(0.6), Sfx("ping", 0.4), Sfx("ping", 1.4), Sfx("ping", 2.4), Pause(3.4),
                         Say("JONAS", "Mathe-Test. Natürlich."), Pause(0.6)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.52, 1.05)), pov="phone_full",
             phone=dict(kind="lock", clock="06:45", notes=NOTES), music="lofi", amb="birds"),

        # --- Szene 2: Küche
        Shot(S.kitchen, [Say("RADIO", "bittet die Feuerwehr Anwohner im Bereich Lindenhof, Fenster vorerst geschlossen zu halten.", fx="radio", vol=0.8),
                         Sfx("chair", 0), Pause(0.3)],
             cam=dict(a=(0.5, 0.45, 1.0), b=(0.55, 0.42, 1.08)),
             chars=[dict(name="MAMA", pos=(0.62, 0.36), r=78, back=True)], music="lofi", amb="room", mvol=0.6),
        Shot(S.kitchen, [Say("MAMA", "Immer diese Panikmache. Hast du für Mathe gelernt?"),
                         Say("JONAS", "So halb."),
                         Say("MAMA", "Papa holt dich heute nicht ab, der hat Spätschicht. Und, Jonas?"),
                         Pause(0.3),
                         Say("MAMA", "Schreib mir, wenn du da bist."),
                         Say("JONAS", "Mama, ich bin sechzehn."),
                         Say("MAMA", "Eben."), Pause(0.4)],
             cam=dict(a=(0.55, 0.42, 1.08), b=(0.58, 0.4, 1.15)),
             chars=[dict(name="MAMA", pos=(0.62, 0.36), r=78, mood="smile")], music="lofi", amb="room", mvol=0.6),

        # --- Szene 3: Schulweg mit Leon
        Shot(S.street_morning, [Say("LEON", "Alter, hast du gesehen? Helix hat irgendwas in die Luft gejagt. Vielleicht fällt Schule aus."),
                                Say("JONAS", "Die stehen direkt hinter unserem Sportplatz. Wenn da was explodiert wär, wüssten wir das."),
                                Say("LEON", "Oder wir sind alle schon verstrahlt und kriegen Superkräfte. Ich nehm Fliegen. Du kriegst… Mathe."),
                                Sfx("siren", 0.2, 0.7, 6), Say("JONAS", "Danke, Mann."), Pause(0.8)],
             cam=dict(a=(0.42, 0.55, 1.0), b=(0.45, 0.52, 1.05), bob=10),
             chars=[dict(name="LEON", pos=(0.72, 0.5), r=80, mood="smile")], music="lofi", amb="street"),

        # --- Szene 4: Krankenwagen
        Shot(school_with_stretcher, [Sfx("rattle", 0, 0.8, 3), Fx("flicker", 0.0, 0.01),
                                     Say("DENNIS", "Der Typ hat mich gebissen, Alter! Voll psycho. Kam aus dem Keller gerannt, einfach so."),
                                     Sfx("growl", 0, 0.7, 1.2),
                                     Say("SANI", "Junge, weg da! Alle Abstand!", speed=165), Pause(0.2)],
             cam=dict(a=(0.5, 0.6, 0.92), b=(0.45, 0.62, 1.0)),
             chars=[dict(name="DENNIS", pos=(0.8, 0.64), r=52, mood="smile"),
                    dict(name="SANI", pos=(0.22, 0.6), r=48, mood="angry")],
             music="none", amb="street"),
        Shot(school_with_stretcher, [Say("LEON", "Das ist Kalle, oder? Der Hausmeister?"),
                                     Say("JONAS", "Kalle ist dicker."), Pause(0.4)],
             cam=dict(a=(0.42, 0.7, 1.15), b=(0.36, 0.72, 1.3)), pov="phone_up",
             phone=dict(kind="camera", zoom=1.8, center=(0.5, 0.5), t0=3),
             chars=[dict(name="DENNIS", pos=(0.8, 0.64), r=52), dict(name="SANI", pos=(0.22, 0.6), r=48, mood="angry")],
             amb="street"),
        Shot(school_with_stretcher, [Pause(1.0), Fx("shake", 0, 0.4, 0.5), Text("Wer ist das?", 2.2), Pause(0.3)],
             cam=dict(a=(0.36, 0.7, 1.15), b=(0.36, 0.7, 1.15)), pov="phone_up",
             phone=dict(kind="camera", t0=7, zoom_path=lambda t: 1.6 + min(1, t / 1.0) * 1.6,
                        wcenter_path=lambda t: (0.4 - 0.2 * min(1, t / 1.0), 0.7 - 0.24 * min(1, t / 1.0))),
             chars=[dict(name="GRAU", pos=(0.2, 0.455), r=34), dict(name="DENNIS", pos=(0.8, 0.64), r=52), dict(name="SANI", pos=(0.22, 0.6), r=48)],
             music="drone", amb="street"),

        # --- Szene 5: Flur, Plakat, Berger
        Shot(S.poster_closeup, [Pause(1.6)], cam=dict(a=(0.5, 0.48, 1.0), b=(0.52, 0.48, 1.1)), music="drone", amb="room"),
        Shot(S.hallway, [Say("BERGER", "Ich hab gesagt, nicht hier. Nicht an der Schule.", fx="phone", vol=0.75), Pause(0.4),
                         Say("BERGER", "Dann sorgt dafür.", fx="phone", vol=0.75), Pause(0.3)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.58, 0.45, 1.12)),
             chars=[dict(name="BERGER", pos=(0.68, 0.43), r=70, back=True)], music="drone", amb="room"),
        Shot(S.hallway, [Say("BERGER", "Jonas, Leon. Rein mit euch, wir fangen gleich an."), Pause(0.3)],
             cam=dict(a=(0.58, 0.45, 1.12), b=(0.6, 0.43, 1.2)),
             chars=[dict(name="BERGER", pos=(0.68, 0.43), r=70, mood="smile")], music="none", amb="room"),

        # --- Klassenraum mit Tim
        Shot(S.classroom, [Say("TIM", "Herzinfarkt. Der Hausmeister. Sagen sie."),
                           Say("JONAS", "Mit vier Gurten?"), Pause(0.5),
                           Say("TIM", "Gute Frage."), Pause(0.4)],
             cam=dict(a=(0.42, 0.5, 1.0), b=(0.36, 0.52, 1.1)),
             chars=[dict(name="TIM", pos=(0.3, 0.5), r=72, mood=lambda t: "neutral" if t < 4 else "worried")],
             pov="hands_desk", music="drone", amb="class"),

        # --- Cliffhanger
        Shot(S.window_view_ambulance, [Pause(1.2), Sfx("thud", 0.0), Sfx("thud", 0.6), Sfx("thud", 1.3), Sfx("slam", 2.6), Pause(3.2)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.55, 1.25)), post=rocking_ambulance, music="tension", amb="class"),
        Shot(S.blinds_closed, [Sfx("whoosh", 0, 0.8), Say("BERGER", "Augen nach vorne. Alle."), Pause(0.5)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.5, 1.04)), music="tension", amb="class"),
        Shot(S.classroom, [Sfx("buzz", 0.3), Pause(3.2), Sfx("hit", 0.0), Fx("black", 0.15, 1.0), Pause(1.0)],
             cam=dict(a=(0.5, 0.6, 1.1), b=(0.5, 0.62, 1.2)), pov="phone_full",
             phone=dict(kind="chat", contact="Unbekannte Nummer", red=True, clock="08:04", msgs=[("in", "Du hast gefilmt. Lösch das.", 0.4)]),
             music="none", amb="class"),
        card("TEIL 2", 1.8, sub="Die Neue"),
    ]
