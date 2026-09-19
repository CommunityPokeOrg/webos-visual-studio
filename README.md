# Visual Studio for HP webOS

A Visual Studio–style IDE written as a **real Mojo application** for legacy
HP/Palm webOS (Pre, Pixi, TouchPad). It follows the authentic Palm SDK app
structure — `appinfo.json`, `sources.json`, stage/scene assistants, Mojo
views — and packages into a `.ipk` with `palm-package`.

Everything is written in ES3/ES5-safe JavaScript (no `let`/`const`, no
`Array#indexOf`/`forEach`, no `Object.keys`, `keyCode`-based key handling)
so it runs on the JavaScriptCore shipped with webOS 1.x–3.x.

## App layout (Mojo conventions)

```
appinfo.json              Mojo application descriptor
icon.png                  64x64 launcher icon
index.html                Mojo bootstrap (loads /usr/palm/frameworks/mojo/mojo.js)
sources.json              packaged source manifest (load order + scene mapping)
framework_config.json     Mojo framework flags
package.sh                palm-package/palm-install/palm-launch wrapper
app/
  assistants/
    stage-assistant.js    app entry point — pushes the main scene
    main-assistant.js     scene owner: app menu, dialogs, IDE host wiring
    newfile-dialog-assistant.js
  views/
    main/main-scene.html      scene template hosting #vs-root
    dialogs/newfile-dialog.html
js/
  ide.js                  the IDE engine (VS2010-style chrome, editor, build,
                          error list, device emulator)
  projects.js             bundled sample solution
lib/
  mojo-shim.js            development shim — minimal Mojo implementation for
                          desktop browsers; no-ops when real mojo.js is present
stylesheets/
  visualstudio.css
```

## Mojo APIs used

- `StageAssistant` / `pushScene("main")` — standard Mojo bootstrap
- `Mojo.Menu.appMenu` — app menu with About item (`handleCommand` /
  `Mojo.Event.command`)
- `Mojo.Model.Cookie` — solution persistence (the Palm cookie store)
- `this.controller.showAlertDialog` / `showDialog` — About and Add New File
- `Mojo.Event.listen` / `Mojo.Event.tap` — widget event wiring

## Build a package

Requires the legacy webOS SDK on your `PATH` (HP webOS SDK 3.0.x, or a
community fork such as webosbrew/webOS-Ports):

```sh
./package.sh            # builds dist/com.communitypoke.visualstudio_1.0.0_all.ipk
./package.sh install    # + palm-install onto a device or the Palm emulator
./package.sh launch     # + palm-launch
```

If the SDK isn't installed, the script explains what's needed and exits
without failing builds.

## Develop in a desktop browser

`lib/mojo-shim.js` provides a minimal Mojo surface (cookie store, scene
loading, dialogs, event helpers) so the app boots without a device:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

On a real device, `/usr/palm/frameworks/mojo/mojo.js` loads and the shim
detects `window.Mojo` and does nothing.

## The IDE

- Menu bar (File / Edit / View / Project / Build / Debug / Help) and toolbar
- Solution Explorer — two sample projects (`HelloWebOS`, `CardDemo`);
  click a project node to make it the startup project
- Tabbed editor with syntax highlighting, line numbers, dirty markers
- `F6` Build — parse-checks project JS and emits VS-style output plus an
  Error List with clickable diagnostics
- `Ctrl+F5` Run — executes project code in a sandbox inside an emulated Pre
  frame; entry point is `main(device)` with `device.setTitle`, `addLabel`,
  `addButton`, `addDivider`, and a captured `console`
- Edits persist via `Mojo.Model.Cookie`

---

CommunityPokeOrg — for Wolfy, who wanted Visual Studio on webOS for real.
