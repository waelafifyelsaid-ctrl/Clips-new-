"""TEIL 4 – Nur eine Prügelei"""
import math

import scenes as S
from engine import Shot, Say, Pause, Sfx, Fx, Text, card

DENNIS_SICK = dict(skin=(195, 180, 160))


def wall_struggle(img, t, d):
    return S.shadow_wall(pose=0.5 + 0.5 * math.sin(t * 9))


def door_handle(img, t, d):
    return S.door_closeup(handle_down=min(1, max(0, (t - 1.0) / 2.2)), dark=True)


def shots():
    return [
        # Hook: Dennis' twitching hand (close on Dennis, pale, head down)
        Shot(S.classroom, [Sfx("heartbeat", 0, 0.8, 3), Text("Dennis?", 1.8), Pause(0.6)],
             cam=dict(a=(0.5, 0.5, 1.3), b=(0.5, 0.5, 1.4)),
             chars=[dict(name="DENNIS", pos=(0.5, 0.5), r=80, back=True, jitter=3)], music="drone", amb="class"),

        # Szene 1
        Shot(S.classroom, [Say("EMILIA", "Hast du Berger nochmal gesehen?", vol=0.85),
                           Say("JONAS", "Nein. Und Marvin auch nicht. Kein Notarzt, gar nichts.", vol=0.85),
                           Say("ALBERS", "Handys weg, meine Damen und Herren. Ich weiß, heute ist ein komischer Tag. Trotzdem: Seite vierundachtzig."),
                           Say("LEON", "Komischer Tag ist untertrieben, Frau Albers."), Pause(0.6),
                           Say("TIM", "Dennis sieht übel aus. Guck dir seine Hand an.", vol=0.8),
                           Say("JONAS", "Der hat heute Morgen die Trage geschoben.", vol=0.8),
                           Say("TIM", "Und der Typ auf der Trage hat ihn gebissen.", vol=0.8), Pause(0.6)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.52, 0.5, 1.04)),
             chars=[dict(name="ALBERS", pos=(0.45, 0.4), r=54),
                    dict(name="DENNIS", pos=(0.5, 0.56), r=70, back=True),
                    dict(name="EMILIA", pos=(0.92, 0.5), r=100)],
             pov="hands_desk", music="drone", amb="class", mvol=0.6),

        # Szene 2: Dennis kippt
        Shot(S.classroom, [Sfx("thud", 0.2, 1.0), Pause(1.0), Say("SCHUELER", "Pennt der?", vol=0.8),
                           Sfx("crowd", 0, 0.5, 1.5),
                           Say("ALBERS", "Dennis? Dennis, geht’s dir nicht gut?"),
                           Say("EMILIA", "Er atmet nicht mehr.", vol=0.8),
                           Say("JONAS", "Was?"), Pause(1.0)],
             cam=dict(a=(0.5, 0.52, 1.05), b=(0.5, 0.55, 1.2)),
             chars=[dict(name="ALBERS", path=[(0, 0.45, 0.4), (4.0, 0.62, 0.46)], r=60, mood="worried"),
                    dict(name="DENNIS", path=[(0, 0.5, 0.56), (0.3, 0.5, 0.63)], r=70, back=True)],
             music="tension", amb="class"),

        # Szene 3: Angriff
        Shot(S.classroom, [Sfx("growl", 0, 1.0, 1.0), Fx("flash", 0, 0.15, 0.6), Pause(1.2)],
             cam=dict(a=(0.5, 0.46, 1.3), b=(0.5, 0.44, 1.45), shake=8),
             chars=[dict(name="DENNIS", pos=(0.5, 0.45), r=100, eyes="milky", mood="angry", override=DENNIS_SICK, noblink=True, jitter=5)],
             music="heart", amb="class"),
        Shot(S.shadow_wall, [Sfx("scream", 0, 0.9, 1.4), Sfx("glass", 0.6, 0.8), Sfx("chair", 0.3), Pause(2.2),
                             Say("SCHUELER", "Schlägerei! Ey, filmt das!", speed=180),
                             Say("LEON", "Dennis, bist du bescheuert?!", speed=178), Pause(0.2)],
             cam=dict(a=(0.5, 0.5, 1.0), shake=12), post=wall_struggle, music="heart", amb="class"),
        Shot(S.classroom, [Sfx("growl", 0, 1.0, 3.0), Fx("shake", 0, 3.0, 1.2),
                           Say("JONAS", "Der… ist… zu stark!", speed=150), Pause(0.4), Sfx("thud", 0), Pause(0.4)],
             cam=dict(a=(0.5, 0.42, 1.45), b=(0.5, 0.42, 1.5), shake=14), pov="arms_push",
             chars=[dict(name="DENNIS", pos=(0.5, 0.4), r=120, eyes="milky", mood="angry", override=DENNIS_SICK, noblink=True, jitter=9)],
             music="heart", amb="class"),
        Shot(S.classroom_door_view, [Say("YILMAZ", "Alle bleiben hier drin! Tür zu!", speed=172), Sfx("slam", 0.6, 1.0), Pause(1.0)],
             cam=dict(a=(0.32, 0.45, 1.05), b=(0.3, 0.45, 1.1), shake=5),
             chars=[dict(name="DENNIS", path=[(0, 0.42, 0.5), (1.6, 0.3, 0.5)], r=58, back=True),
                    dict(name="YILMAZ", path=[(0, 0.48, 0.47), (1.6, 0.34, 0.47)], r=66, mood="angry")],
             music="heart", amb="class"),

        # Szene 4: Danach
        Shot(S.classroom_floor, [Pause(0.4), Say("EMILIA", "Druck drauf! Ich brauch irgendwas zum Abbinden!", speed=170),
                                 Say("LEON", "Hier, nimm meinen Pulli!"), Sfx("whoosh", 0, 0.5),
                                 Say("EMILIA", "Frau Albers, schauen Sie mich an. Atmen. Ganz ruhig atmen."), Pause(0.5)],
             cam=dict(a=(0.5, 0.55, 1.0), b=(0.48, 0.57, 1.06), shake=2),
             chars=[dict(name="ALBERS", pos=(0.35, 0.6), r=66, mood="scared", blood=True),
                    dict(name="EMILIA", pos=(0.68, 0.62), r=66, mood="worried"),
                    dict(name="LEON", pos=(0.88, 0.5), r=84, mood="scared")],
             music="drone", amb="room"),
        Shot(S.classroom_floor, [Pause(0.6), Say("ALBERS", "Er hat mich gebissen. Er hat mich… gebissen.", speed=140), Pause(0.8),
                                 Say("LEON", "Das war keine Prügelei. Jonas. Das war keine Prügelei."), Pause(0.6)],
             cam=dict(a=(0.5, 0.55, 1.05), b=(0.5, 0.57, 1.12)),
             chars=[dict(name="ALBERS", pos=(0.35, 0.6), r=66, mood="scared", blood=True),
                    dict(name="EMILIA", pos=(0.68, 0.62), r=66, mood="worried"),
                    dict(name="LEON", pos=(0.88, 0.5), r=84, mood="scared")],
             music="drone", amb="room"),

        # Cliffhanger
        Shot(S.classroom_floor, [Sfx("scream", 0, 0.7, 1.0), Pause(1.2), Text("Herr Yilmaz…?", 1.4), Pause(0.6)],
             cam=dict(a=(0.5, 0.55, 1.12), b=(0.3, 0.5, 1.12)),
             chars=[dict(name="ALBERS", pos=(0.35, 0.6), r=66, mood="scared", blood=True),
                    dict(name="EMILIA", pos=(0.68, 0.62), r=66, mood="scared"),
                    dict(name="LEON", pos=(0.88, 0.5), r=84, mood="scared")],
             music="tension", amb="none"),
        Shot(S.door_closeup, [Pause(1.0), Sfx("creak", 1.0, 1.0), Pause(2.6), Sfx("hit", 0), Fx("black", 0.15, 1.0), Pause(1.0)],
             cam=dict(a=(0.55, 0.55, 1.05), b=(0.65, 0.55, 1.3)), post=door_handle, music="tension", amb="none"),
        card("TEIL 5", 1.8, sub="Bleibt in euren Räumen"),
    ]
