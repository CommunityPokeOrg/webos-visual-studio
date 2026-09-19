#!/bin/sh
# package.sh — build, install, and launch .ipk packages with the legacy
# Palm/HP webOS SDK tools (palm-package / palm-install / palm-launch) and
# the Palm PDK toolchain (arm-none-linux-gnueabi-gcc) for native code.
#
# Usage:
#   ./package.sh                 # package this Mojo app
#   ./package.sh <dir>           # package another app dir; if it contains a
#                                # Makefile it is treated as a PDK/hybrid
#                                # project and its native code is built first
#   ./package.sh install [dir]   # build + palm-install to device/emulator
#   ./package.sh launch  [dir]   # build + install + palm-launch
#
# Prerequisites:
#   webOS SDK   — palm-package, palm-install, palm-launch, novacomd
#                 (HP webOS SDK 3.0.x, or a community webosbrew/webOS-Ports fork)
#   Palm PDK    — only needed for dirs with a Makefile (native/hybrid apps):
#                 export PalmPDK=/opt/PalmPDK
#                 export PATH="$PalmPDK/arm-gcc/bin:$PATH"
#
# Exit codes: 0 ok, 1 SDK/PDK missing, 2 packaging failed.

set -e

SELF_DIR=$(cd "$(dirname "$0")" && pwd)

ACTION=package
APPDIR=
for arg in "$@"; do
    case "$arg" in
        install|launch) ACTION=$arg;;
        *) APPDIR=$arg;;
    esac
done
APPDIR=${APPDIR:-$SELF_DIR}
cd "$APPDIR"

APPINFO=appinfo.json
if [ ! -f "$APPINFO" ]; then
    echo "error: $APPDIR/appinfo.json not found" >&2
    exit 2
fi

json_field() {
    sed -n 's/.*"'"$1"'"[  ]*:[  ]*"\([^"]*\)".*/\1/p' "$APPINFO" | head -1
}

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

# If this dir carries native code (a Makefile), build it first. Standalone
# PDK apps produce their binary at the package root (type "pdk" +
# appinfo "main" = binary name); hybrid apps produce native/plugin.
if [ -f Makefile ]; then
    if command -v arm-none-linux-gnueabi-gcc >/dev/null 2>&1; then
        echo "== native build (real PDK toolchain) =="
        make
    else
        echo "== native code present but PDK toolchain not on PATH =="
        if [ "$ACTION" = package ]; then
            echo "   continuing — the .ipk will lack a device binary" >&2
        else
            echo "   install/launch needs a real binary; aborting" >&2
            exit 1
        fi
    fi
fi

need_sdk

APP_ID=$(json_field id)
VERSION=$(json_field version)
IPK="$APPDIR/dist/${APP_ID}_${VERSION}_all.ipk"

mkdir -p dist
echo "Packaging ${APP_ID} ${VERSION} ..."
palm-package --outdir dist .

if [ ! -f "$IPK" ]; then
    echo "error: expected package $IPK was not produced" >&2
    exit 2
fi
echo "Built $IPK"

case "$ACTION" in
    install|launch)
        command -v palm-install >/dev/null 2>&1 || { echo "palm-install not found" >&2; exit 1; }
        echo "Installing on device/emulator via novacom ..."
        palm-install "$IPK"
        ;;
esac

if [ "$ACTION" = launch ]; then
    command -v palm-launch >/dev/null 2>&1 || { echo "palm-launch not found" >&2; exit 1; }
    palm-launch "$APP_ID"
fi
