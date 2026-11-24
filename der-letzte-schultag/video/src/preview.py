import sys, importlib
from engine import render, build
ep = importlib.import_module(sys.argv[1])
tl = build(ep.shots())
print("duration", round(tl["d"],1))
for sh in tl["shots"]:
    print(round(sh.start,1), round(sh.d,1), getattr(sh.bg,'__name__',sh.card))
times = [float(x) for x in sys.argv[2:]] if len(sys.argv)>2 else [sh.start + sh.d*0.6 for sh in tl["shots"]]
from engine import frame
import os
os.makedirs("../build/prev", exist_ok=True)
for T in times:
    frame(tl, T).save(f"../build/prev/{sys.argv[1]}_{T:05.1f}.png")
