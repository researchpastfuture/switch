#!/bin/sh
# Build Switch.app for macOS — double-clickable desktop app.
# Usage: sh ~/switch/scripts/build-macos-app.sh [--install]
set -e

SWITCH_ROOT="${SWITCH_ROOT:-$HOME/switch}"
INSTALL=0
if [ "$1" = "--install" ]; then
  INSTALL=1
fi

APP_NAME="Switch.app"
BUILD_DIR="$SWITCH_ROOT/dist"
APP_DIR="$BUILD_DIR/$APP_NAME"

echo "Building $APP_NAME …"
cd "$SWITCH_ROOT"

if [ ! -x ".venv/bin/python" ]; then
  echo "Run install.sh first."
  exit 1
fi

.venv/bin/pip install --quiet -r requirements.txt

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

cat > "$APP_DIR/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>Switch</string>
  <key>CFBundleIdentifier</key>
  <string>org.americasfuture.switch</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Switch</string>
  <key>CFBundleDisplayName</key>
  <string>Switch</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.1</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
PLIST

cat > "$APP_DIR/Contents/MacOS/Switch" << LAUNCHER
#!/bin/bash
SWITCH_ROOT="\${SWITCH_ROOT:-$HOME/switch}"
export PATH="\$SWITCH_ROOT/bin:\$PATH"
cd "\$SWITCH_ROOT" || exit 1
exec "\$SWITCH_ROOT/.venv/bin/python" "\$SWITCH_ROOT/desktop.py"
LAUNCHER
chmod +x "$APP_DIR/Contents/MacOS/Switch"

echo "Built: $APP_DIR"

if [ "$INSTALL" = "1" ]; then
  DEST="$HOME/Applications/$APP_NAME"
  rm -rf "$DEST"
  cp -R "$APP_DIR" "$DEST"
  echo "Installed: $DEST"
  echo "Open from Launchpad or: open \"$DEST\""
else
  echo "Install to Applications: sh $0 --install"
  echo "Or run directly: open \"$APP_DIR\""
fi
