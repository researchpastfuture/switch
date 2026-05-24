#!/bin/sh
# Switch — one-line installer.
# Usage:
#   sh ~/switch/install.sh                # local install (already in place)
#   curl -sSL <raw-url>/install.sh | sh   # remote install (when hosted)
set -e

SWITCH_ROOT="${SWITCH_ROOT:-$HOME/switch}"

if [ ! -d "$SWITCH_ROOT" ]; then
  echo "Switch directory $SWITCH_ROOT does not exist."
  echo "If you have a tarball or a git remote, copy/clone it to $SWITCH_ROOT and re-run."
  exit 1
fi

cd "$SWITCH_ROOT"

# Create venv if missing
if [ ! -x ".venv/bin/python" ]; then
  echo "Creating venv at $SWITCH_ROOT/.venv"
  python3 -m venv .venv
fi

# Install deps
echo "Installing Python dependencies"
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt
.venv/bin/pip install --quiet -r requirements-local.txt 2>/dev/null || true

# Make entry executable
chmod +x bin/switch

# Self-check
.venv/bin/python orchestrator.py >/dev/null && echo "Self-check OK"

# PATH hint
if ! echo "$PATH" | tr ':' '\n' | grep -qx "$SWITCH_ROOT/bin"; then
  echo ""
  echo "  Add Switch to PATH:"
  echo "    echo 'export PATH=\"\$HOME/switch/bin:\$PATH\"' >> ~/.zshrc"
  echo "    source ~/.zshrc"
  echo ""
fi

echo "Switch ready. Try: switch mode"
