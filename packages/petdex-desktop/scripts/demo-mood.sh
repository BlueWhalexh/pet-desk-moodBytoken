#!/usr/bin/env bash
# End-to-end demo of the mood protocol.
#
# Builds sidecar + desktop, launches the binary against the in-tree
# sidecar (PETDEX_SIDECAR_DIR override), then drives all five mood
# levels with a screenshot per level.
#
# Requires: bun, zig 0.16, ZERO_NATIVE_PATH or sibling clone.
# Requires: Screen Recording permission for the parent process
# (Terminal / iTerm / VSCode), or the screencapture step fails with
# "could not create image from display".
#
# Output: ~/petdex-mood-demo/01-energetic.png .. 05-running-tired.png

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZERO_NATIVE_PATH="${ZERO_NATIVE_PATH:-$HOME/Documents/personal/zero-native}"
OUT_DIR="${OUT_DIR:-$HOME/petdex-mood-demo}"
PORT=7777

if [[ ! -d "$ZERO_NATIVE_PATH" ]]; then
  echo "zero-native not found at $ZERO_NATIVE_PATH" >&2
  echo "set ZERO_NATIVE_PATH or clone Railly/zero-native#feature/window-resize" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "==> building sidecar"
cd "$HERE/sidecar"
bun build server.ts --target=node --format=cjs --outfile=server.js >/dev/null

echo "==> building desktop"
cd "$HERE"
ZERO_NATIVE_PATH="$ZERO_NATIVE_PATH" zig build >/dev/null

echo "==> launching desktop (in-tree sidecar)"
PETDEX_SIDECAR_DIR="$HERE/sidecar" "$HERE/zig-out/bin/petdex-desktop" >/tmp/petdex-desktop-demo.log 2>&1 &
DESKTOP_PID=$!
trap "kill $DESKTOP_PID 2>/dev/null || true" EXIT

# Wait for the window to be on screen and the sidecar to be listening.
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 0.5
  if curl -fs "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    break
  fi
  if [[ $i == 10 ]]; then
    echo "sidecar never came up on $PORT" >&2
    exit 1
  fi
done

# Pull the geometry the binary logged so we screencap exactly the
# floating window — no guessing pixels.
GEOM=$(grep -oE 'label="pet" x=[0-9-]+ y=[0-9-]+ width=[0-9]+ height=[0-9]+' /tmp/petdex-desktop-demo.log | tail -1)
WX=$(echo "$GEOM" | awk -F'[ =]' '{for(i=1;i<=NF;i++) if($i=="x"){print $(i+1); exit}}')
WY=$(echo "$GEOM" | awk -F'[ =]' '{for(i=1;i<=NF;i++) if($i=="y"){print $(i+1); exit}}')
WW=$(echo "$GEOM" | awk -F'[ =]' '{for(i=1;i<=NF;i++) if($i=="width"){print $(i+1); exit}}')
WH=$(echo "$GEOM" | awk -F'[ =]' '{for(i=1;i<=NF;i++) if($i=="height"){print $(i+1); exit}}')
RECT="$((WX-10)),$((WY-10)),$((WW+20)),$((WH+20))"
echo "==> window at $WX,$WY ${WW}x${WH} (capture rect $RECT)"

TOKEN="$(cat "$HOME/.petdex/runtime/update-token")"

post_mood() {
  curl -fs -X POST "http://127.0.0.1:$PORT/mood" \
    -H "Content-Type: application/json" \
    -H "X-Petdex-Update-Token: $TOKEN" \
    --data-raw "$1" >/dev/null
}

post_state() {
  curl -fs -X POST "http://127.0.0.1:$PORT/state" \
    -H "Content-Type: application/json" \
    -H "X-Petdex-Update-Token: $TOKEN" \
    --data-raw "$1" >/dev/null
}

shoot() {
  local out="$OUT_DIR/$1"
  sleep 1.5
  if ! screencapture -R "$RECT" "$out" 2>&1; then
    echo "screencapture failed for $out — check Screen Recording permission" >&2
    return 1
  fi
  if [[ ! -s "$out" ]]; then
    echo "screencapture produced empty file $out — likely permission issue" >&2
    return 1
  fi
  echo "   -> $out"
}

echo "==> 1/5 energetic"
post_mood '{"fatigue":0.05,"reason":"fresh start","agent_source":"demo"}'
shoot 01-energetic.png

echo "==> 2/5 normal"
post_mood '{"fatigue":0.3,"agent_source":"demo"}'
shoot 02-normal.png

echo "==> 3/5 tired"
post_mood '{"fatigue":0.55,"reason":"55% of 5h plan window","agent_source":"demo"}'
shoot 03-tired.png

echo "==> 4/5 exhausted"
post_mood '{"fatigue":0.8,"reason":"80% used","agent_source":"demo"}'
shoot 04-exhausted.png

echo "==> 5/5 dying idle"
post_mood '{"fatigue":0.97,"reason":"crashing soon","agent_source":"demo"}'
post_state '{"state":"idle","agent_source":"demo"}'
shoot 05-dying.png

echo
echo "done. screenshots in $OUT_DIR"
ls -la "$OUT_DIR"
