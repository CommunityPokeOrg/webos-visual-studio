# PDK project templates

Copy one of these directories to start a new native (PDK) or hybrid
(Mojo + PDK) webOS project, then build/package with the repo's scripts.

## pdk-standalone

A standalone native application: `type: "pdk"` in `appinfo.json` with
`main` naming the built binary. PDL owns the lifecycle (`PDL_Init` /
`PDL_Quit`), SDL 1.2 gives you the framebuffer, and the PDK's OpenGL ES
1.1 (`-lGLESv1_CM`) or 2.0 (`-lGLESv2`) is available for 3D.

```sh
tools/pdk-build.sh templates/pdk-standalone    # needs arm-none-linux-gnueabi-gcc
package.sh templates/pdk-standalone           # makes the .ipk
package.sh install templates/pdk-standalone   # onto device/emulator
```

## pdk-hybrid

A Mojo app whose main scene embeds a PDK plugin via
`<object type="application/x-palm-plugin">` (the webOS 2.x hybrid model).
The plugin binary is built into `native/plugin` and shipped inside the
same .ipk as the Mojo app (`type: "web"`).

```sh
tools/pdk-build.sh templates/pdk-hybrid
package.sh templates/pdk-hybrid
```

## Toolchain conventions

- Cross compiler: `arm-none-linux-gnueabi-gcc` (plus `-strip`), shipped
  in the PDK's `arm-gcc` toolchain directory.
- Root the SDK with `export PalmPDK=/opt/PalmPDK` and put
  `$PalmPDK/arm-gcc/bin` on `PATH`.
- Headers: `-I$PalmPDK/include -I$PalmPDK/include/SDL`
- Libraries: `-L$PalmPDK/device/lib -Wl,--allow-shlib-undefined`
  `-lSDL -lGLESv2 -lpdl -lm` (use `-lGLESv1_CM` for GLES 1.1 fixed pipeline)
- Everything PDK goes through `PDL_Init`/`PDL_Quit`; `PDL_IsPlugin()`
  distinguishes embedded-plugin mode from standalone execution.

## Without the PDK

`tools/pdk-build.sh --host-check <dir>` runs `gcc -fsyntax-only` against
the sources — a real compiler checking syntax, but no ARM binary. The
IDE's Build command on PDK projects is *simulated*: it echoes the real
command lines and runs lightweight checks, clearly labeled, since a
cross-compile can't happen inside the app.
