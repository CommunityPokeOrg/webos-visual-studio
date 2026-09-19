/* webOS shell — status bar, card view, launcher, gesture area.
 * Emulates the webOS 3.x (TouchPad/Pre) windowing model: apps run in cards,
 * tap the gesture strip (or press Escape) to zoom out to card view, and
 * throw a card up to close it. ES5 throughout. */

var WebOSShell = (function () {

    var stage, statusName, statusClock, launcher, overviewBar;
    var cards = [];
    var activeCard = null;
    var overview = false;

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (text !== undefined) { n.appendChild(document.createTextNode(text)); }
        return n;
    }

    /* ---- app registry --------------------------------------------------- */

    var APPS = {
        "visual-studio": {
            title: "Visual Studio",
            icon: "VS",
            iconCls: "icon-vs",
            boot: function (body) { VisualStudio.create(body, SHELL_API); }
        },
        "settings": {
            title: "Settings",
            icon: "ST",
            iconCls: "icon-settings",
            boot: function (body) {
                var wrap = el("div", "app-page");
                wrap.appendChild(el("h1", "app-h1", "Settings"));
                wrap.appendChild(el("div", "app-note",
                    "Wallpaper hue and clock format. Stored locally, like Palm intended."));
                var hue = el("input");
                hue.type = "range"; hue.min = "0"; hue.max = "360";
                hue.value = String(readSetting("hue", 210));
                var hueRow = el("div", "app-row");
                hueRow.appendChild(el("span", null, "Wallpaper hue"));
                hueRow.appendChild(hue);
                wrap.appendChild(hueRow);
                hue.oninput = function () {
                    writeSetting("hue", hue.value);
                    applyWallpaper();
                };
                var mil = el("input");
                mil.type = "checkbox";
                mil.checked = !!readSetting("clock24", 0);
                var milRow = el("div", "app-row");
                milRow.appendChild(el("span", null, "24-hour clock"));
                milRow.appendChild(mil);
                wrap.appendChild(milRow);
                mil.onchange = function () {
                    writeSetting("clock24", mil.checked ? 1 : 0);
                    tickClock();
                };
                body.appendChild(wrap);
            }
        },
        "about": {
            title: "Device Info",
            icon: "i",
            iconCls: "icon-about",
            boot: function (body) {
                var wrap = el("div", "app-page");
                wrap.appendChild(el("h1", "app-h1", "HP TouchPad"));
                var rows = [
                    ["Model", "TouchPad (emulated)"],
                    ["OS", "HP webOS 3.0.5 (emulated)"],
                    ["Shell", "CommunityPoke card manager"],
                    ["IDE", "Visual Studio for webOS 10.0"]
                ];
                for (var i = 0; i < rows.length; i++) {
                    var r = el("div", "app-row");
                    r.appendChild(el("span", "app-k", rows[i][0]));
                    r.appendChild(el("span", "app-v", rows[i][1]));
                    wrap.appendChild(r);
                }
                body.appendChild(wrap);
            }
        }
    };

    /* ---- settings -------------------------------------------------------- */

    function readSetting(key, dflt) {
        try {
            var v = localStorage.getItem("webos-" + key);
            return v === null ? dflt : v;
        } catch (e) { return dflt; }
    }
    function writeSetting(key, v) {
        try { localStorage.setItem("webos-" + key, v); } catch (e) { }
    }
    function applyWallpaper() {
        var hue = readSetting("hue", 210);
        document.getElementById("wallpaper").style.background =
            "radial-gradient(ellipse at 30% 20%, hsl(" + hue + ",45%,32%) 0%, " +
            "hsl(" + hue + ",55%,14%) 70%, hsl(" + hue + ",60%,8%) 100%)";
    }

    /* ---- status bar ------------------------------------------------------- */

    function tickClock() {
        var d = new Date();
        var h = d.getHours(), m = d.getMinutes();
        var mm = m < 10 ? "0" + m : "" + m;
        if (readSetting("clock24", 0)) {
            statusClock.textContent = h + ":" + mm;
        } else {
            var ap = h >= 12 ? "PM" : "AM";
            h = h % 12; if (h === 0) { h = 12; }
            statusClock.textContent = h + ":" + mm + " " + ap;
        }
    }

    /* ---- cards ------------------------------------------------------------- */

    function openApp(appId) {
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].appId === appId) { focusCard(cards[i]); return; }
        }
        var app = APPS[appId];
        if (!app) { return; }

        var card = el("div", "card");
        var body = el("div", "card-body");
        card.appendChild(body);
        stage.appendChild(card);

        var model = { appId: appId, app: app, el: card, body: body };
        cards.push(model);

        // drag-up-to-close while in card view
        var dragY = null, startY = 0;
        card.addEventListener("mousedown", function (e) {
            if (!overview) { return; }
            dragY = 0; startY = e.clientY;
            e.preventDefault();
            var mv = function (ev) {
                dragY = ev.clientY - startY;
                if (dragY < 0) {
                    card.style.transform = card.dataset.baseTransform +
                        " translateY(" + dragY + "px)";
                }
            };
            var up = function () {
                document.removeEventListener("mousemove", mv);
                document.removeEventListener("mouseup", up);
                if (dragY < -120) {
                    closeCard(model);
                } else {
                    card.style.transform = card.dataset.baseTransform || "";
                }
                dragY = null;
            };
            document.addEventListener("mousemove", mv);
            document.addEventListener("mouseup", up);
        });
        card.addEventListener("click", function () {
            if (overview) { focusCard(model); }
        });

        app.boot(body);
        focusCard(model);
    }

    function focusCard(card) {
        activeCard = card;
        for (var i = 0; i < cards.length; i++) {
            cards[i].el.className = "card" + (cards[i] === card ? " card-on" : "");
        }
        statusName.textContent = card.app.title;
        if (overview) { exitOverview(); }
    }

    function closeCard(card) {
        var idx = cards.indexOf(card);
        if (idx < 0) { return; }
        cards.splice(idx, 1);
        card.el.className = "card card-closing";
        setTimeout(function () {
            if (card.el.parentNode) { card.el.parentNode.removeChild(card.el); }
        }, 250);
        if (activeCard === card) {
            activeCard = cards.length ? cards[cards.length - 1] : null;
            statusName.textContent = activeCard ? activeCard.app.title : "webOS";
        }
        if (overview) { layoutOverview(); }
    }

    /* ---- card view ---------------------------------------------------------- */

    function layoutOverview() {
        var w = stage.clientWidth;
        var spacing = Math.min(340, Math.max(200, w / (cards.length + 1)));
        var total = spacing * (cards.length - 1);
        var x0 = (w - total) / 2;
        for (var i = 0; i < cards.length; i++) {
            var t = "translateX(" + (x0 + i * spacing - w / 2) + "px) scale(0.6)";
            cards[i].el.dataset.baseTransform = t;
            cards[i].el.style.transform = t;
        }
    }

    function enterOverview() {
        overview = true;
        stage.className = "overview";
        overviewBar.style.display = "";
        layoutOverview();
        for (var i = 0; i < cards.length; i++) { cards[i].el.className = "card card-overview"; }
    }
    function exitOverview() {
        overview = false;
        stage.className = "";
        overviewBar.style.display = "none";
        for (var i = 0; i < cards.length; i++) {
            cards[i].el.style.transform = "";
            cards[i].el.dataset.baseTransform = "";
            cards[i].el.className = "card" + (cards[i] === activeCard ? " card-on" : "");
        }
    }
    function toggleOverview() {
        if (overview) { exitOverview(); }
        else if (cards.length) { enterOverview(); }
    }

    /* ---- shell API handed to apps ------------------------------------------ */

    var SHELL_API = {
        closeActive: function () { if (activeCard) { closeCard(activeCard); } },
        overview: function () { toggleOverview(); }
    };

    /* ---- boot --------------------------------------------------------------- */

    function boot() {
        stage = document.getElementById("stage");
        statusName = document.getElementById("sb-left");
        statusClock = document.getElementById("sb-clock");
        launcher = document.getElementById("launcher");
        overviewBar = document.getElementById("justtype");

        applyWallpaper();
        tickClock();
        setInterval(tickClock, 10000);

        // launcher icons
        for (var id in APPS) {
            (function (appId) {
                var app = APPS[appId];
                var ic = el("button", "dock-icon " + app.iconCls, app.icon);
                ic.title = app.title;
                ic.onclick = function () { openApp(appId); };
                launcher.appendChild(ic);
            })(id);
        }

        document.getElementById("gesturebar").onclick = toggleOverview;
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { toggleOverview(); }
        });

        // "Just Type" filters open cards while in card view
        var jt = document.getElementById("justtype-input");
        jt.addEventListener("input", function () {
            var q = jt.value.toLowerCase();
            for (var i = 0; i < cards.length; i++) {
                cards[i].el.style.opacity =
                    cards[i].app.title.toLowerCase().indexOf(q) >= 0 ? "" : "0.25";
            }
        });

        // boot straight into the IDE — that is what you came for
        openApp("visual-studio");
    }

    document.addEventListener("DOMContentLoaded", boot);
    return SHELL_API;
})();
