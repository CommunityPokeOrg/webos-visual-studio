#!/bin/sh
# package.sh — build, install, and launch the .ipk with the legacy Palm/HP
# webOS SDK tools (palm-package / palm-install / palm-launch).
#
# Prerequisites (any of):
#   - HP/Palm webOS SDK 3.0.x (TouchPad) or 1.4.5/2.x — installs palm-package,
#     palm-install, palm-launch, and novacomd onto your PATH
#   - The community SDK: https://github.com/webosbrew/webos-sdk or the
#     webOS-Ports SDK fork
#
# Usage:
#   ./package.sh            # build dist/<id>_<version>_all.ipk
#   ./package.sh install    # build + palm-install to a connected device/emulator
#   ./package.sh launch     # build + install + palm-launch
#
# Exit codes: 0 ok, 1 SDK missing, 2 packaging failed.

set -e
cd "$(dirname "$0")"

APPINFO=appinfo.json
if [ ! -f "$APPINFO" ]; then
    echo "error: $APPINFO not found — run from the app directory" >&2
    exit 2
fi

need_sdk() {
    if ! command -v palm-package >/dev/null 2>&1; then
        cat >&2 <<'EOF'
palm-package not found.

Install the legacy webOS SDK first:
  * HP/Palm webOS SDK 3.0.x (TouchPad) — provides palm-package,
    palm-install, palm-launch and the novacom device bridge.
  * Or the community-maintained SDK (webosbrew / webOS-Ports forks).

Then re-run this script with the SDK tools on your PATH.
EOF
        exit 1
    fi
}

json_field() {
    # minimal grep-based extraction; the SDK also ships palm scripts, but this
    # keeps the script dependency-free.
    sed -n 's/.*"'"$1"'"[  ]*:[  ]*"\([^"]*\)".*/\1/p' "$APPINFO" | head -1
}

need_sdk

APP_ID=$(json_field id)
VERSION=$(json_field version)
IPK="dist/${APP_ID}_${VERSION}_all.ipk"

mkdir -p dist
echo "Packaging ${APP_ID} ${VERSION} ..."
palm-package --outdir dist .

if [ ! -f "$IPK" ]; then
    echo "error: expected package $IPK was not produced" >&2
    exit 2
fi
echo "Built $IPK"

case "${1:-}" in
    install|launch)
        command -v palm-install >/dev/null 2>&1 || { echo "palm-install not found" >&2; exit 1; }
        echo "Installing on device/emulator via novacom ..."
        palm-install "$IPK"
        ;;
esac

if [ "${1:-}" = "launch" ]; then
    command -v palm-launch >/dev/null 2>&1 || { echo "palm-launch not found" >&2; exit 1; }
    palm-launch "$APP_ID"
fi
