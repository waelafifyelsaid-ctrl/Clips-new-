"""TEIL 2 – Die Neue"""
import scenes as S
from engine import Shot, Say, Pause, Sfx, Fx, Text, card


def shots():
    return [
        # Hook: delete prompt, thumb taps "Abbrechen"
        Shot(S.classroom, [Pause(1.6), Sfx("ping", 0, 0.5), Say("JONAS", "Nein."), Pause(0.5)],
             cam=dict(a=(0.5, 0.6, 1.1)), pov="phone_full", phone=dict(kind="prompt", tap=1.5, clock="08:05"),
             music="drone", amb="class"),

        # Szene 1: Die Neue kommt
        Shot(S.classroom_door_view, [Sfx("creak", 0.2, 0.8), Pause(1.4),
                                     Say("BERGER", "Das ist Emilia Wagner. Sie kommt aus Hamburg und ist ab heute bei uns."),
                                     Say("BERGER", "Emilia, da hinten neben Jonas ist frei."), Pause(0.3)],
             cam=dict(a=(0.32, 0.45, 1.05), b=(0.4, 0.45, 1.12)),
             chars=[dict(name="EMILIA", path=[(0, 0.3, 0.52), (1.2, 0.3, 0.46)], r=64, mood="worried"),
                    dict(name="BERGER", pos=(0.62, 0.45), r=66, mood="smile")],
             music="none", amb="class"),
        Shot(S.classroom, [Say("LEON", "Bro. Bro. Bro.", speed=175, vol=0.8), Say("JONAS", "Halt die Klappe.", vol=0.8), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.5, 1.03)),
             chars=[dict(name="LEON", pos=(0.5, 0.48), r=96, mood="smile")], music="none", amb="class"),
        Shot(S.classroom, [Pause(2.6)],
             cam=dict(a=(0.6, 0.5, 1.05), b=(0.62, 0.48, 1.15)),
             chars=[dict(name="EMILIA", pos=(0.72, 0.44), r=110)], music="motif", amb="class"),

        # Szene 2: Erstes Gespräch
        Shot(S.classroom, [Say("EMILIA", "Ist das hier jeden Montag so? Krankenwagen zur Begrüßung?"),
                           Say("JONAS", "Nur für dich."),
                           Say("EMILIA", "Wie nett."), Pause(0.4),
                           Say("EMILIA", "Hast du das gefilmt? Ich hab dich vorhin gesehen."),
                           Say("JONAS", "Irgendwer will, dass ich’s lösche."), Pause(0.3)],
             cam=dict(a=(0.62, 0.48, 1.15), b=(0.66, 0.46, 1.22)),
             chars=[dict(name="EMILIA", pos=(0.72, 0.44), r=110, mood=lambda t: "smile" if 6 < t < 9 else "neutral")],
             pov="hands_desk", music="motif", amb="class", mvol=0.6),
        Shot(S.classroom, [Say("EMILIA", "Mein Vater ist Intensivpfleger. Einen Herzinfarkt schnallt man nicht mit vier Gurten fest."),
                           Say("EMILIA", "So fixiert man jemanden, der um sich schlägt."),
                           Say("JONAS", "Woher weißt du sowas?"),
                           Say("EMILIA", "Meine Mutter war Sanitäterin."),
                           Say("JONAS", "War?"), Pause(0.6),
                           Say("EMILIA", "War."), Pause(0.8)],
             cam=dict(a=(0.66, 0.46, 1.22), b=(0.7, 0.44, 1.32)),
             chars=[dict(name="EMILIA", pos=(0.72, 0.44), r=110, mood=lambda t: "worried")],
             music="motif", amb="class", mvol=0.7),

        # Szene 3: Pause im Flur
        Shot(S.hallway, [Sfx("bell", 0, 0.7), Pause(0.6),
                         Say("LEON", "Leon. Bester Freund, Gentleman, zukünftiger Millionär."),
                         Say("EMILIA", "Emilia. Nicht beeindruckt."),
                         Say("LEON", "Ich mag sie."), Pause(0.2)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.5, 1.05)),
             chars=[dict(name="EMILIA", pos=(0.27, 0.47), r=74), dict(name="LEON", pos=(0.72, 0.47), r=78, mood="smile")],
             music="lofi", amb="cafeteria", mvol=0.5),
        Shot(S.hallway, [Say("TIM", "Helix hat seine Pressemitteilung geändert. Erst Störfall, jetzt technische Wartung. Vor zehn Minuten."),
                         Say("JONAS", "Und das heißt?"),
                         Say("TIM", "Das heißt, jemand lügt."), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.05), b=(0.5, 0.48, 1.12)),
             chars=[dict(name="TIM", pos=(0.5, 0.47), r=80, mood="worried")], music="lofi", amb="cafeteria", mvol=0.4),
        Shot(S.hallway, [Pause(0.6), Sfx("heartbeat", 0, 0.6, 2.5), Pause(2.4)],
             cam=dict(a=(0.5, 0.48, 1.0), b=(0.5, 0.42, 1.6)),
             chars=[dict(name="DENNIS", pos=(0.5, 0.42), r=34, mood="worried", override=dict(skin=(190, 170, 150)))],
             music="drone", amb="cafeteria"),

        # Cliffhanger
        Shot(S.hallway, [Sfx("buzz", 0.2), Pause(3.0),
                         Say("EMILIA", "Mein Vater schreibt nie in ganzen Sätzen.", vol=0.9), Pause(0.4)],
             cam=dict(a=(0.5, 0.5, 1.1)), pov="phone_full",
             phone=dict(kind="chat", contact="Papa", clock="09:41",
                        msgs=[("in", "Bleib heute in der Schule. Egal was passiert. Geh nicht nach draußen. Ich erklär’s dir später.", 0.4)]),
             music="drone", amb="cafeteria"),
        Shot(S.hallway, [Sfx("bell_broken", 0, 0.8), Fx("flicker", 1.2, 1.2), Sfx("flicker", 1.2), Pause(2.6),
                         Sfx("hit", 0), Fx("black", 0.15, 1.0), Pause(1.0)],
             cam=dict(a=(0.5, 0.5, 1.0), b=(0.5, 0.5, 1.06)),
             chars=[dict(name="EMILIA", pos=(0.27, 0.47), r=74, mood="scared"), dict(name="TIM", pos=(0.5, 0.47), r=70, mood="scared"),
                    dict(name="LEON", pos=(0.74, 0.47), r=78, mood="scared")],
             music="tension", amb="none"),
        card("TEIL 3", 1.8, sub="Gebissen"),
    ]
