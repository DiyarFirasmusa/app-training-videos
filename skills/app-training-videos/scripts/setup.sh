#!/usr/bin/env bash
# Copies the training-video toolkit into <project>/training-video and installs its dependencies.
# Usage: bash setup.sh [project-dir]     (default: current directory)
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$(cd "${1:-.}" && pwd)"
TARGET="$PROJECT/training-video"

if [ -e "$TARGET/training.config.ts" ]; then
  echo "training-video/ already set up in $PROJECT (left untouched)."
  exit 0
fi
mkdir -p "$TARGET"
cp -R "$SKILL_DIR/templates/." "$TARGET/"
printf 'node_modules\nremotion/node_modules\nrecordings/\noutput/\nframes/\naria/\n' > "$TARGET/.gitignore"

if command -v bun >/dev/null 2>&1; then PM="bun install"; else PM="npm install"; fi
(cd "$TARGET" && $PM)
(cd "$TARGET/remotion" && $PM)
# Browser used for recording (and for rendering, if Remotion's own browser cannot start).
(cd "$TARGET" && npx --yes playwright install chromium)

echo
echo "Ready: $TARGET"
echo "Next: edit training-video/training.config.ts (dev command, fake API host, sign-in), then write mock/ and videos/."
