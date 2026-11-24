#!/bin/bash
# Renders episodes one after another; commits+pushes each finished video.
cd "$(dirname "$0")"
for ep in "$@"; do
  while pgrep -f "node render.cjs ep[0-9]* *$" >/dev/null || pgrep -f "render.cjs ep[0-9]+$" >/dev/null; do sleep 20; done
  NODE_PATH=$(npm root -g) node render.cjs $ep > build/$ep.log 2>&1
  if [ -f out/$ep.mp4 ]; then
    cd .. && git add tag-null && git commit -q -m "TAG NULL: render $ep" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UUywnK12Xa8nQ6n3iTsBdK" && (for i in 1 2 3; do git push -q -u origin claude/stories-sjvpcx && break; sleep 10; done); cd tag-null
  fi
done
