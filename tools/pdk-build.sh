#!/bin/sh
# pdk-build.sh — compile the native half of a PDK project.
#
# Usage:
#   ./tools/pdk-build.sh <project-dir>          build with the PDK toolchain
#   ./tools/pdk-build.sh --host-check <dir>     host-gcc syntax check only
#
# Requires the Palm PDK cross toolchain (arm-none-linux-gnueabi-gcc and
# friends) on PATH, typically via:
#   export PalmPDK=/opt/PalmPDK
#   export PATH="$PalmPDK/arm-gcc/bin:$PATH"
#
# Without the toolchain, --host-check still verifies sources compile
# syntactically with the system compiler — useful in CI — but no ARM
# binary is produced. Real device binaries REQUIRE the PDK.

set -e

MODE=build
DIR=
case "${1:-}" in
    --host-check) MODE=hostcheck; DIR="$2";;
    -h|--help)
        sed -n '2,14p' "$0"; exit 0;;
    *) DIR="$1";;
esac

if [ -z "$DIR" ] || [ ! -d "$DIR" ]; then
    echo "usage: $0 [--host-check] <pdk-project-dir>" >&2
    exit 2
fi

if [ ! -f "$DIR/Makefile" ]; then
    echo "error: $DIR has no Makefile — not a PDK project dir" >&2
    exit 2
fi

if [ "$MODE" = hostcheck ]; then
    if ! command -v gcc >/dev/null 2>&1; then
        echo "error: no host gcc for --host-check" >&2
        exit 1
    fi
    echo "== host syntax check (simulated — no ARM binary produced) =="
    make -C "$DIR" host-check
    exit 0
fi

if ! command -v arm-none-linux-gnueabi-gcc >/dev/null 2>&1; then
    cat >&2 <<'EOF'
arm-none-linux-gnueabi-gcc not found.

The Palm PDK toolchain is required to produce a device binary:
  * Install the HP/Palm PDK (e.g. to /opt/PalmPDK)
  * export PATH="$PalmPDK/arm-gcc/bin:$PATH"

For a syntax-only check without the toolchain:
  ./tools/pdk-build.sh --host-check <dir>
EOF
    exit 1
fi

echo "== building with $(arm-none-linux-gnueabi-gcc -dumpversion) toolchain =="
make -C "$DIR"
echo "== done =="
