"""TEIL 5 – Bleibt in euren Räumen"""
import scenes as S
from engine import Shot, Say, Pause, Sfx, Fx, Text, card


def lamp_flicker(img, t, d):
    if 5.0 < t < 5.6:
        return S.window_night_street()  # man gone (chars are drawn on top separately)
    return img


def shots():
    return [
        # Hook: Yilmaz bursts in
        Shot(S.classroom_door_view, [Sfx("slam", 0, 1.0), Fx("shake", 0, 0.5, 1.4), Say("YILMAZ", "Abschließen!", speed=180), Pause(0.2)],
             cam=dict(a=(0.3, 0.45, 1.2), b=(0.3, 0.45, 1.25), shake=6),
             chars=[dict(name="YILMAZ", path=[(0, 0.3, 0.5), (0.6, 0.36, 0.52)], r=78, mood="scared", blood=True)],
             music="heart", amb="class"),

        # Szene 1: Durchsage
        Shot(S.classroom_door_view, [Sfx("knock", 0, 0.6), Pause(0.4),
                                     Say("YILMAZ", "Er hat sich losgerissen. Er ist… im Treppenhaus."), Sfx("pa", 0, 0.8), Pause(0.4),
                                     Say("DURCHSAGE", "Achtung, eine Durchsage der Schulleitung. Alle Schülerinnen und Schüler bleiben bis auf Weiteres in ihren Klassenräumen.", fx="pa"),
                                     Say("DURCHSAGE", "Türen geschlossen halten. Das ist keine Übung. Ich wiederhole: Das ist keine Übung.", fx="pa"),
                                     Pause(0.4)],
             cam=dict(a=(0.32, 0.55, 1.1), b=(0.32, 0.58, 1.18)),
             chars=[dict(name="YILMAZ", pos=(0.33, 0.64), r=78, mood="scared", blood=True)],
             music="drone", amb="room"),

        # Szene 2: Warten
        Shot(S.classroom, [Sfx("ping", 0.2), Pause(4.0), Sfx("ping", 0)],
             cam=dict(a=(0.5, 0.55, 1.1)), pov="phone_full",
             phone=dict(kind="chat", contact="Mama ❤", clock="13:58",
                        msgs=[("out", "Lockdown an der Schule. Mir geht’s gut.", 0.2),
                              ("in", "Ich weiß, es kommt im Radio. Polizei sagt Schlägerei unter Drogeneinfluss. Bleib wo du bist. Ich liebe dich.", 2.0)]),
             music="drone", amb="room"),
        Shot(S.classroom_floor, [Say("LEON", "Drogen. Die sagen Drogen."),
                                 Say("EMILIA", "Sie hat Fieber. Schnell steigendes Fieber."),
                                 Say("TIM", "Dennis wurde heute Morgen gebissen. Von dem Mann auf der Trage. Sechs Stunden später…"),
                                 Pause(0.4), Say("TIM", "Wenn das ansteckend ist…"),
                                 Say("JONAS", "Sag’s nicht."), Pause(0.5)],
             cam=dict(a=(0.5, 0.52, 1.0), b=(0.52, 0.55, 1.08)),
             chars=[dict(name="ALBERS", pos=(0.33, 0.62), r=62, mood="worried", blood=True, override=dict(skin=(230, 200, 190))),
                    dict(name="EMILIA", pos=(0.62, 0.6), r=66, mood="worried"),
                    dict(name="LEON", pos=(0.88, 0.48), r=82, mood="angry"),
                    dict(name="TIM", pos=(0.12, 0.46), r=80, mood="worried")],
             music="drone", amb="room"),

        # Szene 3: Der Mann am Zaun
        Shot(S.fence_view, [Sfx("thud", 0.3, 0.5), Sfx("thud", 1.4, 0.5), Sfx("thud", 2.5, 0.5), Pause(2.6),
                            Say("POLIZIST", "Bleiben Sie stehen! Hände, wo ich sie sehen kann!", fx="phone", vol=0.8), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.45, 0.5, 1.12)),
             chars=[dict(name="BADEMANTEL", path=[(0, 0.32, 0.38), (0.6, 0.32, 0.37), (1.2, 0.32, 0.38), (1.8, 0.32, 0.37), (2.4, 0.32, 0.38)], r=40, jitter=4),
                    dict(name="POLIZIST", pos=(0.62, 0.52), r=46, mood="angry")],
             music="tension", amb="street"),
        Shot(S.fence_view, [Sfx("growl", 0, 0.7, 1.0), Pause(0.7), Sfx("taser", 0, 0.9, 1.0), Fx("flash", 0, 0.2, 0.7), Pause(1.6),
                            Say("LEON", "Der… steht einfach wieder auf."),
                            Say("EMILIA", "Taser wirken nur bei Leuten, die Schmerz spüren.", vol=0.85), Pause(0.4)],
             cam=dict(a=(0.45, 0.5, 1.12), b=(0.5, 0.48, 1.35)),
             chars=[dict(name="BADEMANTEL", path=[(0, 0.32, 0.38), (0.7, 0.5, 0.48), (1.2, 0.5, 0.56), (2.6, 0.5, 0.56), (3.2, 0.52, 0.5)], r=44, jitter=6),
                    dict(name="POLIZIST", path=[(0, 0.62, 0.52), (2.0, 0.7, 0.54)], r=46, mood="scared")],
             music="tension", amb="street"),

        # Szene 4: Zeitsprung
        card("18:20 Uhr", 1.4, beats=[Sfx("whoosh", 0), Pause(1.4)]),
        Shot(S.parents_crowd, [Sfx("siren", 0, 0.4, 4), Sfx("crowd", 0, 0.6, 4), Pause(2.6)],
             cam=dict(a=(0.5, 0.55, 1.0), b=(0.5, 0.55, 1.1)),
             chars=[dict(name="MAMA", path=[(0, 0.5, 0.6), (1.8, 0.5, 0.52)], r=110, mood="worried")],
             music="motif", amb="street"),
        Shot(S.parents_crowd, [Pause(2.2)],
             cam=dict(a=(0.4, 0.55, 1.05), b=(0.6, 0.55, 1.05)),
             chars=[dict(name="EMILIA", pos=(0.55, 0.58), r=64, mood="worried")], music="motif", amb="street"),
        card("23:40 Uhr", 1.4, beats=[Sfx("whoosh", 0), Pause(1.4)]),
        Shot(S.bedroom_night, [Pause(3.2), Say("JONAS", "Regulär. Klar.", vol=0.8), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.1)), pov="phone_full",
             phone=dict(kind="mail", clock="23:40", sender="Schulleitung Lindenhof-Gesamtschule", subject="Information für Eltern",
                        body=["Liebe Eltern,", "nach einem isolierten Vorfall findet der Unterricht morgen regulär statt.",
                              "Die Polizei hat die Lage unter Kontrolle.", "Mit freundlichen Grüßen, die Schulleitung"]),
             music="drone", amb="night"),

        # Cliffhanger
        Shot(S.stretcher_closeup, [Pause(1.4), Say("JONAS", "Das war nie der Hausmeister."), Pause(0.6)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.5, 1.12)), pov="phone_full",
             phone=dict(kind="video", zoom_path=lambda t: 1.0 + min(1, t / 1.2) * 0.8, center=(0.5, 0.5), progress=0.12),
             music="tension", amb="night"),
        Shot(S.window_night_street, [Sfx("hum", 0, 0.8, 5), Pause(4.6), Fx("blink", 0, 0.15), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.58, 0.58, 1.4)),
             chars=[dict(name="GRAU", pos=(0.58, 0.6), r=40)],
             music="tension", amb="night"),
        Shot(S.window_night_street, [Sfx("flicker", 0, 0.6), Fx("flicker", 0, 0.5), Pause(1.8), Sfx("hit", 0), Fx("black", 0.15, 1.0), Pause(1.0)],
             cam=dict(a=(0.58, 0.58, 1.4)), music="none", amb="night"),
        card("TEIL 6", 2.0, sub="Der zweite Tag"),
    ]
