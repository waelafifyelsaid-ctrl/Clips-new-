#!/bin/bash
# Renders episodes one after another; commits+pushes each finished video.
cd "$(dirname "$0")"
for ep in "$@"; do
  while pgrep -f "node render.cjs ep[0-9]* *$" >/dev/null || pgrep -f "render.cjs ep[0-9]+$" >/dev/null; do sleep 20; done
  NODE_PATH=$(npm root -g) node render.cjs $ep > build/$ep.log 2>&1
  if [ -f out/$ep.mp4 ] && [ $(stat -c%s out/$ep.mp4) -gt 45000000 ]; then ffmpeg -v error -y -i out/$ep.mp4 -c:v libx264 -preset slow -crf 25 -maxrate 3M -bufsize 6M -pix_fmt yuv420p -c:a copy -movflags +faststart out/${ep}_s.mp4 && mv out/${ep}_s.mp4 out/$ep.mp4; fi
  if [ -f out/$ep.mp4 ]; then
    cd .. && git add tag-null/out/$ep.mp4 tag-null/episodes tag-null/engine tag-null/audio tag-null/*.md tag-null/*.cjs tag-null/*.sh tag-null/package.json && git commit -q -m "TAG NULL: render $ep" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UUywnK12Xa8nQ6n3iTsBdK" && (for i in 1 2 3; do git push -q -u origin claude/stories-sjvpcx && break; sleep 10; done); cd tag-null
  fi
done
# final sweep: commit any finished videos that were rendered outside this queue
cd .. && git add tag-null/out/*.mp4 && git commit -q -m "TAG NULL: remaining rendered episodes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UUywnK12Xa8nQ6n3iTsBdK" && (for i in 1 2 3; do git push -q -u origin claude/stories-sjvpcx && break; sleep 10; done)
