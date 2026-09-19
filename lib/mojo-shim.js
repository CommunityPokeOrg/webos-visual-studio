/* Browser development shim — implements just enough of the Mojo framework for
 * this app to boot outside a real webOS device/emulator. On-device this file
 * loads after /usr/palm/frameworks/mojo/mojo.js and does nothing, because
 * window.Mojo already exists.
 *
 * Supported surface (enough for this app, not a Mojo reimplementation):
 *   Mojo.Log.info/error/warn
 *   Mojo.Event.tap, Mojo.Event.command, Mojo.Event.listen/stopListening
 *   Mojo.Menu.appMenu
 *   Mojo.Model.Cookie (localStorage-backed)
 *   Mojo.Controller.stageController.{pushScene,activate,deactivate}
 *   Scene controller: get, setupWidget (no-op), showAlertDialog, showDialog,
 *     listen, stopListening, serviceRequest (returns stub)
 * Requires the app to be served over HTTP (e.g. `python3 -m http.server`)
 * so scene templates can be fetched; over file:// a minimal built-in scene
 * is used instead. */

(function () {
    if (typeof Mojo !== "undefined") { return; }
    var Mojo = window.Mojo = {};

    Mojo.Log = {
        info: function () { if (window.console) { console.log.apply(console, arguments); } },
        warn: function () { if (window.console) { console.warn.apply(console, arguments); } },
        error: function () { if (window.console) { console.error.apply(console, arguments); } }
    };

    Mojo.Event = {
        tap: "mojo-event-tap",
        command: "mojo-event-command",
        listen: function (el, type, fn) {
            var domType = type === Mojo.Event.tap ? "click" : type;
            el.addEventListener(domType, fn, false);
        },
        stopListening: function (el, type, fn) {
            var domType = type === Mojo.Event.tap ? "click" : type;
            el.removeEventListener(domType, fn, false);
        }
    };

    Mojo.Menu = {
        appMenu: "appMenu",
        viewMenu: "viewMenu",
        commandMenu: "commandMenu"
    };

    /* Cookie: on-device this is the Palm cookie store; here it is
     * localStorage so browser sessions persist too. */
    Mojo.Model = {
        Cookie: function (name) {
            this.name = name;
        }
    };
    Mojo.Model.Cookie.prototype = {
        get: function () {
            try {
                var raw = localStorage.getItem("mojo-cookie-" + this.name);
                return raw === null ? undefined : JSON.parse(raw);
            } catch (e) { return undefined; }
        },
        put: function (value) {
            try {
                localStorage.setItem("mojo-cookie-" + this.name, JSON.stringify(value));
            } catch (e) { }
        },
        remove: function () {
            try { localStorage.removeItem("mojo-cookie-" + this.name); } catch (e) { }
        }
    };

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (text !== undefined) { n.appendChild(document.createTextNode(text)); }
        return n;
    }

    function SceneController(sceneEl, sceneName) {
        this.sceneElement = sceneEl;
        this.sceneName = sceneName;
    }
    SceneController.prototype = {
        get: function (id) { return document.getElementById(id); },
        setupWidget: function (name, attrs, model) {
            /* no-op in the shim; the IDE builds its own menus in-app */
        },
        listen: function (elOrId, type, fn) {
            var target = typeof elOrId === "string" ? this.get(elOrId) : elOrId;
            if (target) { Mojo.Event.listen(target, type, fn); }
        },
        stopListening: function (elOrId, type, fn) {
            var target = typeof elOrId === "string" ? this.get(elOrId) : elOrId;
            if (target) { Mojo.Event.stopListening(target, type, fn); }
        },
        getSceneController: function () { return this; },
        showAlertDialog: function (o) {
            window.alert((o.title ? o.title + "\n\n" : "") + (o.message || ""));
            if (o.onChoose) { o.onChoose(o.choices && o.choices[0] && o.choices[0].value); }
        },
        showDialog: function (o) {
            var overlay = el("div", "vs-modal-overlay");
            var dlg = el("div", "vs-modal shim-dialog");
            var html = "";
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", o.template + ".html", false);
                xhr.send(null);
                if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                    html = xhr.responseText;
                }
            } catch (e) { }
            dlg.innerHTML = html;
            overlay.appendChild(dlg);
            document.body.appendChild(overlay);
            var widget = { mojo: { close: function () {
                if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
            } } };
            if (o.assistant) {
                o.assistant.controller = this;
                o.assistant.setup(widget);
            }
        },
        serviceRequest: function () {
            return { cancel: function () { } };
        },
        watchModel: function () { },
        enableFullScreenMode: function () { }
    };

    var stageController = {
        pushScene: function (name) { loadScene(typeof name === "string" ? name : name.name); },
        popScene: function () { },
        activate: function () { },
        deactivate: function () { },
        enableFullScreenMode: function () { },
        getScenes: function () { return []; }
    };

    Mojo.Controller = {
        stageController: stageController,
        getAppController: function () {
            return {
                getStageController: function () { return stageController; },
                closeAllStages: function () { },
                getScreenOrientation: function () { return "up"; }
            };
        }
    };

    function fetchText(url) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                return xhr.responseText;
            }
        } catch (e) { }
        return null;
    }

    function loadScene(name) {
        var html = fetchText("app/views/" + name + "/" + name + "-scene.html");
        if (html === null) { html = '<div class="palm-scene"><div id="vs-root"></div></div>'; }
        var holder = document.createElement("div");
        holder.innerHTML = html;
        var sceneEl = holder.firstChild;
        document.body.appendChild(sceneEl);

        var ctorName = name.charAt(0).toUpperCase() + name.slice(1) + "Assistant";
        var Ctor = window[ctorName];
        if (Ctor) {
            var assistant = new Ctor();
            assistant.controller = new SceneController(sceneEl, name);
            assistant.setup();
        }
    }

    function boot() {
        var stage = new StageAssistant();
        stage.controller = stageController;
        stage.setup();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
