"""TEIL 3 – Gebissen"""
import scenes as S
from engine import Shot, Say, Pause, Sfx, Fx, Text, card

MARVIN_HURT = dict(name="MARVIN", r=80, mood="scared", blood=True, override=dict(skin=(225, 215, 200)))


def shots():
    return [
        # Hook
        Shot(S.glass_door_hand, [Sfx("thud", 0.05, 1.2), Fx("shake", 0.05, 0.5, 1.2), Text("Mittagspause.", 1.8), Pause(0.3)],
             cam=dict(a=(0.5, 0.48, 1.25), b=(0.5, 0.48, 1.1)), music="none", amb="cafeteria"),

        # Szene 1: Normaler Mittag
        Shot(S.cafeteria, [Say("LEON", "Mathe war ein Verbrechen. Ich verklag die Schule."),
                           Say("EMILIA", "Was hast du bei Aufgabe drei?"),
                           Say("LEON", "Meinen Namen."), Sfx("crowd", 0, 0.5, 2), Pause(1.0)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.48, 0.5, 1.04)),
             chars=[dict(name="LEON", pos=(0.22, 0.52), r=72, mood="smile"),
                    dict(name="EMILIA", pos=(0.5, 0.5), r=70, mood=lambda t: "smile" if t > 4.5 else "neutral"),
                    dict(name="TIM", pos=(0.79, 0.52), r=72)],
             music="lofi", amb="cafeteria", mvol=0.5),
        Shot(S.cafeteria, [Say("TIM", "Hab im Discord gelesen, in der Weststadt hat ein Typ einen Busfahrer angefallen. Gebissen."),
                           Say("LEON", "Hallbrück halt. Montags beißen die Leute."), Pause(0.4)],
             cam=dict(a=(0.6, 0.5, 1.12), b=(0.62, 0.5, 1.15)),
             chars=[dict(name="LEON", pos=(0.22, 0.52), r=72, mood="smile"), dict(name="EMILIA", pos=(0.5, 0.5), r=70),
                    dict(name="TIM", pos=(0.79, 0.52), r=72, mood="worried")],
             music="lofi", amb="cafeteria", mvol=0.5),

        # Szene 2: Marvin
        Shot(S.cafeteria, [Sfx("slam", 0, 0.9), Fx("shake", 0, 0.4), Pause(0.8),
                           Say("MARVIN", "Hilfe… Leute… Der hat mich gebissen!", speed=170),
                           Say("SCHUELER", "Wer?!"),
                           Say("MARVIN", "Im Keller… ich war rauchen, da unten… da war so ein Typ in ’nem weißen Anzug… der kam einfach raus und hat mich…", speed=172),
                           Pause(0.2)],
             cam=dict(a=(0.5, 0.42, 1.25), b=(0.5, 0.4, 1.35)),
             chars=[dict({**MARVIN_HURT, "path": [(0, 0.5, 0.36), (1.0, 0.5, 0.42)]})],
             music="tension", amb="cafeteria"),
        Shot(S.cafeteria, [Say("SCHUELERIN", "Oh Gott, ist das Blut?!", speed=175), Sfx("chair", 0.1),
                           Say("TIM", "Jemand muss einen Krankenwagen rufen! Sofort!", speed=170),
                           Say("LEON", "Alter… Alter, guck dir seinen Arm an."), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.48, 1.08), shake=3),
             chars=[dict(name="LEON", pos=(0.2, 0.52), r=72, mood="scared"), dict(name="TIM", pos=(0.8, 0.52), r=72, mood="scared"),
                    dict({**MARVIN_HURT, "pos": (0.5, 0.44), "r": 70})],
             music="tension", amb="cafeteria"),
        Shot(S.cafeteria, [Say("EMILIA", "Arm hoch. Höher. Jonas, drück hier. Fest.", speed=168),
                           Say("JONAS", "Okay. Okay."),
                           Sfx("heartbeat", 0, 0.7, 4),
                           Say("MARVIN", "Mir ist so kalt…", vol=0.8), Pause(0.5)],
             cam=dict(a=(0.5, 0.45, 1.2), b=(0.5, 0.45, 1.3), shake=3), pov="arms_push",
             chars=[dict({**MARVIN_HURT, "pos": (0.48, 0.42), "r": 100}),
                    dict(name="EMILIA", pos=(0.15, 0.5), r=80, mood="worried")],
             music="drone", amb="cafeteria"),

        # Szene 3: Berger übernimmt
        Shot(S.cafeteria, [Pause(0.5), Say("BERGER", "Wo ist das passiert?"), Say("MARVIN", "Keller.", vol=0.8), Pause(0.4),
                           Say("BERGER", "Gut. Alles gut. Ich bring ihn ins Sekretariat, der Notarzt ist gleich da. Alle essen weiter!"),
                           Say("EMILIA", "Er muss liegen, er hat einen Schock…"),
                           Say("BERGER", "Ich kümmere mich drum, Emilia.", speed=170), Pause(0.4)],
             cam=dict(a=(0.5, 0.44, 1.15), b=(0.55, 0.42, 1.2)),
             chars=[dict(name="BERGER", pos=(0.62, 0.4), r=80, mood=lambda t: "scared" if t < 3 else "angry",
                         override=dict(skin=(225, 205, 190))),
                    dict({**MARVIN_HURT, "pos": (0.3, 0.46), "r": 74})],
             music="drone", amb="cafeteria"),

        # Cliffhanger
        Shot(S.cafeteria, [Say("LEON", "Was war das denn?", vol=0.85), Say("EMILIA", "Der hatte Angst. Berger hatte richtig Angst.", vol=0.85),
                           Say("JONAS", "Ich schau, wo er hingeht.", vol=0.85), Pause(0.6)],
             cam=dict(a=(0.5, 0.5, 1.05), b=(0.5, 0.45, 1.15)),
             chars=[dict(name="LEON", pos=(0.22, 0.52), r=72, mood="worried"), dict(name="EMILIA", pos=(0.5, 0.5), r=70, mood="worried"),
                    dict(name="TIM", pos=(0.79, 0.52), r=72, mood="worried")],
             music="drone", amb="cafeteria"),
        Shot(S.glass_door_view, [Pause(3.2), Say("JONAS", "Das ist nicht das Sekretariat.", vol=0.8), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.45, 0.5, 1.1)),
             chars=[dict(name="BERGER", path=[(0, 0.56, 0.46), (3.5, 0.26, 0.5)], r=44, back=True),
                    dict(name="MARVIN", path=[(0, 0.46, 0.47), (3.5, 0.17, 0.51)], r=40, back=True)],
             music="tension", amb="room"),
        Shot(S.glass_door_view, [Sfx("creak", 0, 0.7), Pause(1.4), Sfx("scream", 0, 0.8, 1.3), Pause(1.4), Sfx("slam", 0, 1.0),
                                 Fx("shake", 0, 0.5, 1.2), Pause(0.6), Sfx("hit", 0.1), Fx("black", 0.2, 1.0), Pause(1.2)],
             cam=dict(a=(0.42, 0.5, 1.1), b=(0.25, 0.55, 1.5)), music="none", amb="room"),
        card("TEIL 4", 1.8, sub="Nur eine Prügelei"),
    ]
