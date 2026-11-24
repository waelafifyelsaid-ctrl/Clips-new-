# Videos – Animatics Teil 1–5

`out/teil01.mp4` … `out/teil05.mp4`: 720×1280, 24 fps, 83–103 s.

These are animatics: scenes drawn in code, synthetic German voices (espeak-ng + MBROLA),
synthesized sound effects and music. They follow the scripts in `../01_phase1_teil01-05.md`.

## Rebuild
Needs Python 3 with Pillow, numpy, scipy; ffmpeg; espeak-ng with mbrola-de1/2/4/5/6/7.

    cd src
    python3 -c "from engine import render; import ep1; render('teil01', ep1.shots(), '../out')"

- `gfx.py`, `scenes.py`, `chars.py`: drawing (backgrounds, characters)
- `phone.py`: POV hands and phone UI
- `audio.py`: voices, SFX, music
- `engine.py`: timeline, lip sync, subtitles, camera, mixing, encoding
- `ep1.py` … `ep5.py`: one file per episode
