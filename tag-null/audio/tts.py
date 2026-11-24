"""Neural German voices (Piper). Input: JSON list of {who,text}. Output: JSON map 'who|text' -> {d, env, file}."""
import hashlib, json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = os.path.join(ROOT, "build", "voices")
CACHE = os.path.join(ROOT, "build", "tts")
os.makedirs(CACHE, exist_ok=True)

# who -> (voice, length_scale, pitch_semitones)
CAST = {
    "EMILIA": ("de-kerstin-low", 1.0, 1.0),
    "NACHBAR": ("de-thorsten-low", 1.05, -2.0),
    "FRAU": ("de-ramona-low", 1.0, 0.0),
    "MAMA": ("de-ramona-low", 1.0, -1.0),
    "MANN": ("de-karlsson-low", 1.0, 0.0),
    "SOLDAT": ("de-karlsson-low", 0.95, -1.5),
    "NEWS": ("de-pavoque-low", 1.0, 0.0),
    "RADIO": ("de-pavoque-low", 1.02, 0.0),
    "DURCHSAGE": ("de-thorsten-low", 1.1, -1.0),
    "KIND": ("de-eva_k-x-low", 0.95, 3.0),
    "LENA": ("de-eva_k-x-low", 0.95, 3.5),
    "BEN": ("de-thorsten-low", 0.98, -0.5),
    "MIA": ("de-eva_k-x-low", 0.95, 2.0),
    "ARZT": ("de-karlsson-low", 1.0, -0.5),
}
SR = 44100


def read(path):
    with wave.open(path) as w:
        sr, n = w.getframerate(), w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    return a, sr


def resample(a, sr, factor=1.0):
    n_out = int(len(a) * SR / sr / factor)
    return np.interp(np.linspace(0, len(a) - 1, n_out), np.arange(len(a)), a).astype(np.float32)


def synth(who, text):
    voice, ls, semi = CAST.get(who, CAST["MANN"])
    key = hashlib.md5(f"{voice}|{ls}|{semi}|{text}".encode()).hexdigest()
    out = os.path.join(CACHE, key + ".wav")
    if not os.path.exists(out):
        model = os.path.join(VOICES, voice, voice + ".onnx")
        raw = out + ".raw.wav"
        subprocess.run(["piper", "-m", model, "-f", raw, "--length-scale", str(ls), "--noise-scale", "0.6", "--noise-w-scale", "0.75"],
                       input=text.encode(), check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        a, sr = read(raw)
        os.remove(raw)
        # pitch shift by resampling + keep duration roughly (simple: accept tempo change of a few %)
        factor = 2 ** (semi / 12)
        a = resample(a, sr, factor)
        idx = np.where(np.abs(a) > 0.02)[0]
        if len(idx):
            a = a[max(0, idx[0] - 300): idx[-1] + 1500]
        a = a / (np.max(np.abs(a)) or 1) * 0.9
        with wave.open(out, "w") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((a * 32767).astype(np.int16).tobytes())
    a, _ = read(out)
    hop = SR // 24
    env = []
    for i in range(0, len(a), hop):
        r = float(np.sqrt(np.mean(a[i:i + hop] ** 2))) if len(a[i:i + hop]) else 0
        env.append(round(min(1.0, r * 5), 2))
    return {"d": len(a) / SR, "env": env, "file": out}


if __name__ == "__main__":
    lines = json.load(open(sys.argv[1]))
    res = {}
    for ln in lines:
        k = ln["who"] + "|" + ln["text"]
        if k not in res:
            res[k] = synth(ln["who"], ln["text"])
    json.dump(res, open(sys.argv[2], "w"))
