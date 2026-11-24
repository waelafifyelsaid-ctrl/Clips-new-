# TAG NULL – Produktion

## Pipeline
- **3D:** three.js läuft in headless Chromium (SwiftShader). Toon-Shading, Konturen per Kantenerkennung (Tiefe und Normalen), Fischaugen-Objektiv, Farbkorrektur, Filmkorn.
  - `engine/core.js`: Renderer, Post-Processing, HUD
  - `engine/characters.js`: Figuren mit Gelenken, Posen, Laufzyklus, gemaltem Gesicht (Blinzeln, Mund, Mimik, Zombie-Augen)
  - `engine/sets.js`: Schlafzimmer, Stadt, Flur, Treppenhaus (2 Etagen), Badezimmer, Gegenüber-Gebäude
  - `engine/pov.js`: POV-Arme und Handy mit live gezeichnetem Bildschirm
  - `engine/fx.js`: Hubschrauber, Explosion, Rauch, Feuer, Trümmer, Blaulicht
  - `engine/player.js`: Zeitleiste aus Beats, Lippensynchronität, Untertitel, Karten, Effekte
- **Stimmen:** Piper (neuronal, Deutsch) über `audio/tts.py`. Die Stimmen liegen in `build/voices/` (aus GitHub-Releases von rhasspy/piper v0.0.2, nicht im Repo).
- **Ton:** `audio/mix.py` erzeugt Soundeffekte, Atmo und Musik synthetisch und mischt mit Ducking unter Dialog.
- **Rendern:**
  - `node render.cjs epXX` erzeugt `out/epXX.mp4` (720×1280, 24 fps)
  - `--preview auto` rendert 12 Vorschaubilder nach `build/epXX/`
- **Warteschlange:** `./queue.sh ep03 ep04 …` rendert nacheinander und committet und pusht jedes fertige Video.
- **Debug:** `node engine/debugshot.cjs ep02 30.0 "<js>" out.jpg`

## Folge schreiben
Eine Folge liegt in `episodes/epXX.js` und exportiert `function (E) { … return { meta, shots } }`. Ein Shot besteht aus:
- `beats`: `['say', WER, Text, {fx, vol}]`, `['wait', s]`, `['text', Gedanke, s]`, `['sfx', name, {off, d, vol}]`, `['fx', 'flash'|'shake'|'black'|'red'|'aberr'|'fadein'|'fadeout', {off, d, k}]`, `['mark', name]`
- `init()`, `update(lt, d, T)`, optional `hud(g)` und `card: [Titel, Untertitel]`
- `music` (`morning`, `drone`, `tension`, `action`, `sad`, `heart`) und `amb` (`room`, `city`, `city_chaos`, `birds`, `night`, `fire`, `wind`)

Kamera: `E.cam(pos, look, {fov, shake})`. Figuren: `E.actor(NAME, spec)`, `ch.pose(...)`, `E.face(ch, x, z)`, `chars.layDown(...)`.

## Stand
| Teil | Skript | Video |
|---|---|---|
| 1 Der Morgen | ✔ | ✔ |
| 2 Die Tür | ✔ | ✔ |
| 3 Krause | ✔ | ✔ |
| 4 Kein Netz | ✔ | ✔ |
| 5 SOS | ✔ | ✔ |
| 6 Hinterhaus | ✔ | ✔ |
| 7–30 | Handlung in STORY.md | offen (nächster Schritt: Teil 7 „Zurück“) |

## Bekannte Grenzen
- Die Figuren sind aus Grundformen gebaut. Sie wirken stilisiert, nicht so ausgearbeitet wie modellierte Figuren.
- Die Stimmen sind neuronal, aber 16 kHz und ohne echte Emotion.
- Eine Minute Video braucht etwa 7 Minuten Renderzeit (Software-Rendering ohne GPU).
