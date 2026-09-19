# Visual Studio for HP webOS

A Visual Studio–style IDE that lives inside a simulated HP webOS environment —
cards, launcher, gesture area, and all. Built as a love letter to the mobile OS
that did multitasking right.

Everything is vanilla HTML/CSS/JS in ES5, so the same files run both in a modern
browser and (in spirit, and mostly in practice) inside the WebKit engine that
shipped on the Pre, Pixi, and TouchPad. The repo also carries real webOS
packaging metadata — `appinfo.json`, `framework_config.json`, `sources.json`,
`depends.js` — so the app can be wrapped into an `.ipk` with the Palm/HP SDK.

## What's inside

- **webOS shell** (`js/webos.js`) — status bar with live clock, dock-style
  launcher, Just Type filtering, and the card metaphor: tap the gesture strip
  (or press `Esc`) to zoom out to card view, flick a card up to close it.
- **Visual Studio** (`js/ide.js`) — the IDE itself, styled after the
  Visual Studio 2010 era:
  - Menu bar (File / Edit / View / Project / Build / Debug / Help)
  - Toolbar with New, Save, Build, and ▶ Run
  - Solution Explorer with two sample projects (click a project to make it the
    startup project)
  - Tabbed editor with live syntax highlighting and line numbers
  - Output window with authentic `------ Build started ------` output
  - Error List with clickable diagnostics
  - A little emulated Pre — Run launches your app's `main(device)` inside a
    device frame with a captured `console`
- **Sample projects** (`js/projects.js`) — `HelloWebOS` and `CardDemo`.
- **Packaging metadata** — `appinfo.json`, `sources.json`, `depends.js`,
  `framework_config.json`, `icon.png`.

## Run it in a browser

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

or just open `index.html` directly — there are no build steps.

## Package it for a real device

With the legacy webOS SDK (`palm-package` / `palm-install`) installed:

```sh
palm-package .
palm-install com.communitypoke.visualstudio_1.0.0_all.ipk
palm-launch com.communitypoke.visualstudio
```

Caveat: real webOS WebKit is ancient — the ES5 code mostly holds up, but modern
CSS flex/gradient features will degrade on-device. It *should* limp along on a
TouchPad running 3.0.x. Pull requests that improve on-device compatibility are
welcome.

## Controls

| Action | How |
| --- | --- |
| Card view | Tap the gesture strip at the bottom, or press `Esc` |
| Close a card | In card view, drag the card upward and release |
| Filter cards | Type in the "Just type..." bar while in card view |
| Build | `F6` or the Build menu |
| Run on emulator | `Ctrl+F5` or ▶ Run |
| Save file | `Ctrl+S` |

## Writing apps for the emulator

A project runs all of its `.js` files, then calls `main(device)`:

```js
function main(device) {
    device.setTitle("My App");
    device.clear();
    device.addLabel("Hello, webOS!");
    device.addButton("Tap me", function () {
        console.log("tap!");
    });
}
```

`device` provides `setTitle`, `clear`, `addLabel` (returns `{ setText }`),
`addButton(label, cb)`, and `addDivider`. A stub `enyo.kind()` is also present
for flavor.

---

CommunityPokeOrg — for Wolfy, who asked for Visual Studio on a phone from 2011.
