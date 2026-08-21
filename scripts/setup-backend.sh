#!/usr/bin/env bash
# Creates backend/.venv with the newest Python 3.11+ available and installs deps.
set -euo pipefail

cd "$(dirname "$0")/.."

PY=""
for candidate in python3.13 python3.12 python3.11 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    version=$("$candidate" -c 'import sys; print("%d%02d" % sys.version_info[:2])')
    if [ "$version" -ge 311 ]; then
      PY="$candidate"
      break
    fi
  fi
done

if [ -z "$PY" ]; then
  echo "error: Python 3.11+ is required but was not found on PATH." >&2
  echo "       Install it (e.g. 'brew install python@3.13') and re-run 'npm run setup'." >&2
  exit 1
fi

echo "→ using $PY ($("$PY" --version))"
"$PY" -m venv backend/.venv
backend/.venv/bin/python -m pip install --quiet --upgrade pip
backend/.venv/bin/pip install --quiet -r backend/requirements.txt
echo "→ backend/.venv ready"
