#!/bin/bash
# One-time environment setup for rendering TAG NULL (idempotent).
set -e
cd "$(dirname "$0")"
pip install -q piper-tts scipy numpy 2>/dev/null || pip install piper-tts scipy numpy
[ -d node_modules/three ] || npm install --silent
mkdir -p build/voices
for v in de-thorsten-low de-eva_k-x-low de-kerstin-low de-ramona-low de-pavoque-low de-karlsson-low; do
  if [ ! -f build/voices/$v/$v.onnx ]; then
    curl -sSfL -o /tmp/$v.tar.gz "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-$v.tar.gz"
    mkdir -p build/voices/$v && tar xzf /tmp/$v.tar.gz -C build/voices/$v && rm /tmp/$v.tar.gz
  fi
done
node -e "require('playwright')" 2>/dev/null || NODE_PATH=$(npm root -g) node -e "require('playwright')"
echo "setup ok"
