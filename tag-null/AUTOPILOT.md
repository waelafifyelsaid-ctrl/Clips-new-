# TAG NULL – Autopilot (Anleitung für die automatische Produktion)

Diese Datei ist die Arbeitsanweisung für die geplante Claude-Sitzung, die regelmäßig neue Folgen produziert.

## Ablauf pro Lauf
1. **Branch holen:** `git fetch origin claude/stories-sjvpcx && git checkout -B claude/stories-sjvpcx FETCH_HEAD`
2. **Umgebung einrichten:** `cd tag-null && ./setup.sh`. Das installiert Piper, scipy und three.js und lädt die Stimmen.
3. **Lesen:** `STORY.md` (Handlung), `PRODUCTION.md` (Engine-API und Stand), dazu die letzten zwei Folgen in `episodes/` als Vorlage für Stil und Anschluss.
4. **Nächste Folge wählen:** die erste Zeile mit „offen“ in `PRODUCTION.md`. Pro Lauf höchstens zwei neue Folgen.
5. **Schreiben:** `episodes/epNN.js`.
   - Anschluss an den Cliffhanger der Vorfolge.
   - Hook in den ersten 3 Sekunden.
   - 75–100 Sekunden Länge.
   - Eigener Cliffhanger, danach eine Karte „TEIL N+1“.
   - Du (POV) sprichst nie. Gedanken als `['text', …]`.
   - `meta.clock` mit Datum und Uhrzeit, die an die Vorfolge anschließen. Ein Zeitsprung wird als Karte mit `clock:`/`date:` umgesetzt.
   - Gewalt nur andeuten: Schnitt weg, Schatten, Ton.
   - Neue Orte als Funktion in `engine/sets.js` anlegen und bestehende wiederverwenden.
6. **Vorschau:** `NODE_PATH=$(npm root -g) node render.cjs epNN --preview auto`, dann die Bilder in `build/epNN/` als Kontaktbogen ansehen. Jedes Bild prüfen:
   - Ist die Figur sichtbar und nicht abgeschnitten?
   - Steckt die Kamera in keiner Wand und keiner Figur?
   - Ist das Bild hell genug?
   - Sind die Untertitel lesbar?
   - Gibt es keine schwebenden Objekte?

   Fehler beheben und die Vorschau wiederholen, bis alles stimmt. Vorschau-Artefakt: Beim Springen fehlen die `init()`-Aufrufe vorheriger Shots. Jeder Shot muss deshalb seinen eigenen Zustand in `init()` vollständig setzen.
7. **Rendern:** `NODE_PATH=$(npm root -g) node render.cjs epNN`. Wenn `out/epNN.mp4` größer als 45 MB ist, mit `ffmpeg -crf 25 -maxrate 3M` neu kodieren.
8. **Stichprobe:** 6 Bilder aus dem fertigen MP4 ziehen und ansehen.
9. **Abschließen:** In `PRODUCTION.md` die Statuszeile aktualisieren. Dann nur fertige Dateien committen und auf `claude/stories-sjvpcx` pushen.

## Qualitätsregeln
- Jede Einstellung braucht einen klaren Bildinhalt. Lieber weniger Bewegung als Kamerafahrten durch Wände.
- Figuren immer mit `E.face(...)` sinnvoll ausrichten.
- Abstand der Kamera zu Gesichtern: mindestens 0,7 m, außer bei bewussten Großaufnahmen.
- Musik und Ambient passend zur Stimmung setzen. Die Spannung baut sich zum Ende auf: `riser` → `boom` → Schwarzbild.
- Keine neuen Abhängigkeiten aus dem Internet außer denen in `setup.sh`.
