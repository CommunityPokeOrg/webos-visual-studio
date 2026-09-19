/* Visual Studio for webOS — the IDE engine.
 * VS2010-era chrome rendered inside a single Mojo scene. Written in ES3/ES5
 * only (var, function expressions, no forEach/indexOf/Object.keys/JSON) so it
 * runs on the JavaScriptCore shipped with webOS 1.x–3.x.
 *
 * Host interface passed to create():
 *   host.store          { load() -> obj|null, save(obj) }  (Mojo.Model.Cookie on device)
 *   host.showAbout()    opens the About dialog
 *   host.newFileDialog(fn)  opens the Add New File dialog; fn(name) on accept
 */

var VisualStudio = (function () {

    var JS_KEYWORDS = ("break case catch class const continue debugger default " +
        "delete do else enum export extends false finally for function if " +
        "implements import in instanceof interface let new null package " +
        "private protected public return static super switch this throw " +
        "true try typeof var void while with yield").split(" ");

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (text !== undefined) { n.appendChild(document.createTextNode(text)); }
        return n;
    }

    function arrIndexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) { return i; }
        }
        return -1;
    }

    function isKeyword(w) { return arrIndexOf(JS_KEYWORDS, w) >= 0; }

    function escapeHtml(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /* ---- syntax highlighting ------------------------------------------ */

    function highlightLine(line) {
        var out = "", i = 0, ch;
        while (i < line.length) {
            ch = line[i];
            if (ch === "/" && line[i + 1] === "/") {
                out += '<span class="tok-com">' + escapeHtml(line.slice(i)) + "</span>";
                return out;
            }
            if (ch === "/" && line[i + 1] === "*") {
                var end = line.indexOf("*/", i + 2);
                if (end < 0) { end = line.length; } else { end += 2; }
                out += '<span class="tok-com">' + escapeHtml(line.slice(i, end)) + "</span>";
                i = end;
                continue;
            }
            if (ch === '"' || ch === "'") {
                var j = i + 1;
                while (j < line.length && line[j] !== ch) {
                    if (line[j] === "\\") { j += 1; }
                    j += 1;
                }
                j = Math.min(j + 1, line.length);
                out += '<span class="tok-str">' + escapeHtml(line.slice(i, j)) + "</span>";
                i = j;
                continue;
            }
            var m = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(line.slice(i));
            if (m) {
                var w = m[0];
                out += isKeyword(w) ? '<span class="tok-kw">' + w + "</span>" : escapeHtml(w);
                i += w.length;
                continue;
            }
            var num = /^\d+(\.\d+)?/.exec(line.slice(i));
            if (num) {
                out += '<span class="tok-num">' + num[0] + "</span>";
                i += num[0].length;
                continue;
            }
            out += escapeHtml(ch);
            i += 1;
        }
        return out;
    }

    function highlight(code) {
        var lines = code.split("\n");
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            out.push(highlightLine(lines[i]));
        }
        return out.join("\n");
    }

    /* ---- solution model ----------------------------------------------- */

    function loadSolution(store) {
        var saved = store.load();

        var projects = [];
        for (var i = 0; i < VS_SAMPLES.length; i++) {
            var src = VS_SAMPLES[i];
            var files = [];
            for (var j = 0; j < src.files.length; j++) {
                var f = src.files[j];
                files.push({ name: f.name, language: f.language, content: f.content });
            }
            projects.push({ name: src.name, description: src.description, files: files });
        }
        if (saved && saved.projects) {
            for (var k = 0; k < saved.projects.length; k++) {
                var sp = saved.projects[k];
                var proj = null;
                for (var p = 0; p < projects.length; p++) {
                    if (projects[p].name === sp.name) { proj = projects[p]; break; }
                }
                if (!proj) {
                    proj = { name: sp.name, description: "", files: [] };
                    projects.push(proj);
                }
                for (var q = 0; q < sp.files.length; q++) {
                    var sf = sp.files[q], found = null;
                    for (var r = 0; r < proj.files.length; r++) {
                        if (proj.files[r].name === sf.name) { found = proj.files[r]; break; }
                    }
                    if (found) { found.content = sf.content; }
                    else {
                        proj.files.push({ name: sf.name,
                            language: sf.language || "javascript",
                            content: sf.content });
                    }
                }
            }
        }
        return { name: "WebOSSolution", projects: projects, startupIndex: 0 };
    }

    function saveSolution(store, solution) {
        var data = { projects: [] };
        for (var i = 0; i < solution.projects.length; i++) {
            var p = solution.projects[i];
            var files = [];
            for (var j = 0; j < p.files.length; j++) {
                files.push({ name: p.files[j].name, language: p.files[j].language,
                    content: p.files[j].content });
            }
            data.projects.push({ name: p.name, files: files });
        }
        store.save(data);
    }

    /* ---- build diagnostics -------------------------------------------- */

    function checkFile(file) {
        var problems = [];
        var src = file.content;
        var depth = 0, depthLine = 0, firstNeg = -1;
        var lines = src.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i], inStr = null;
            for (var c = 0; c < line.length; c++) {
                var ch = line[c];
                if (inStr) {
                    if (ch === "\\") { c += 1; }
                    else if (ch === inStr) { inStr = null; }
                } else if (ch === '"' || ch === "'") {
                    inStr = ch;
                } else if (ch === "/" && line[c + 1] === "/") {
                    break;
                } else if (ch === "{") {
                    depth += 1;
                    if (depth === 1) { depthLine = i + 1; }
                } else if (ch === "}") {
                    depth -= 1;
                    if (depth < 0 && firstNeg < 0) { firstNeg = i + 1; }
                }
            }
        }
        try {
            new Function(src); // parse-only
        } catch (e) {
            problems.push({ line: 0, code: "VS1002", text: "Syntax error: " + e.message });
        }
        if (firstNeg > 0) {
            problems.push({ line: firstNeg, code: "VS1029", text: "Unexpected '}'" });
        } else if (depth !== 0) {
            problems.push({ line: depthLine || lines.length, code: "VS1513", text: "'}' expected" });
        }
        return problems;
    }

    /* ---- emulator ----------------------------------------------------- */

    function makeDevice(screenEl, onLog) {
        var api = {
            setTitle: function (t) {
                var kids = screenEl.parentNode.childNodes;
                for (var i = 0; i < kids.length; i++) {
                    if (kids[i].className === "emu-title") {
                        kids[i].textContent = t;
                        return;
                    }
                }
            },
            clear: function () { screenEl.innerHTML = ""; },
            addLabel: function (text) {
                var d = el("div", "emu-label", text);
                screenEl.appendChild(d);
                return { setText: function (t) { d.textContent = t; } };
            },
            addButton: function (label, cb) {
                var b = el("button", "emu-btn", label);
                b.onclick = function () { try { cb(); } catch (e) { onLog("error: " + e.message); } };
                screenEl.appendChild(b);
                return b;
            },
            addDivider: function () { screenEl.appendChild(el("div", "emu-divider")); }
        };
        return api;
    }

    /* ---- IDE ----------------------------------------------------------- */

    function create(container, host) {
        var solution = loadSolution(host.store);
        var openTabs = [];        // [{project, file}]
        var activeTab = null;

        var root = el("div", "vs-root");

        /* menu bar */
        var menubar = el("div", "vs-menubar");
        var menus = {
            "File": [
                { label: "New File...\tCtrl+N", fn: function () { promptNewFile(); } },
                { label: "Save\tCtrl+S", fn: function () { saveActive(); } },
                { label: "Save All", fn: function () { saveAll(); } },
                null,
                { label: "Close Editor", fn: function () { if (activeTab) { closeTab(activeTab); } } }
            ],
            "Edit": [
                { label: "Undo\tCtrl+Z", fn: function () { document.execCommand("undo"); } },
                { label: "Redo\tCtrl+Y", fn: function () { document.execCommand("redo"); } },
                null,
                { label: "Select All\tCtrl+A", fn: function () { if (input) { input.focus(); input.select(); } } }
            ],
            "View": [
                { label: "Solution Explorer", fn: function () { togglePane(explorer); } },
                { label: "Output", fn: function () { showBottomTab("output"); } },
                { label: "Error List", fn: function () { showBottomTab("errors"); } },
                { label: "Device Emulator", fn: function () { showBottomTab("emulator"); } }
            ],
            "Project": [
                { label: "Add New File...", fn: function () { promptNewFile(); } },
                { label: "Set Startup Project", fn: function () { cycleStartup(); } }
            ],
            "Build": [
                { label: "Build Solution\tF6", fn: function () { build(false); } },
                { label: "Rebuild Solution", fn: function () { build(true); } },
                { label: "Clean Solution", fn: function () { cleanOutput(); } }
            ],
            "Debug": [
                { label: "Start Without Debugging\tCtrl+F5", fn: function () { run(); } },
                { label: "Break All", fn: function () { out("The emulator ignored your breakpoint. It is a phone."); } }
            ],
            "Help": [
                { label: "About Visual Studio for webOS", fn: function () { host.showAbout(); } }
            ]
        };
        var openMenuEl = null;
        function closeMenu() {
            if (openMenuEl && openMenuEl.parentNode) {
                openMenuEl.parentNode.removeChild(openMenuEl);
            }
            openMenuEl = null;
        }
        document.addEventListener("mousedown", function (e) {
            if (openMenuEl && !openMenuEl.contains(e.target)) { closeMenu(); }
        }, false);
        for (var mName in menus) {
            if (menus.hasOwnProperty(mName)) {
                (function (name) {
                    var item = el("span", "vs-menu-item", name);
                    item.onmousedown = function (e) {
                        e.preventDefault();
                        if (openMenuEl) { closeMenu(); return; }
                        var dd = el("div", "vs-menu-dd");
                        var items = menus[name];
                        for (var i = 0; i < items.length; i++) {
                            var it = items[i];
                            if (it === null) { dd.appendChild(el("div", "vs-menu-sep")); continue; }
                            (function (entry) {
                                var parts = entry.label.split("\t");
                                var row = el("div", "vs-menu-row");
                                row.appendChild(el("span", "vs-menu-label", parts[0]));
                                if (parts[1]) { row.appendChild(el("span", "vs-menu-key", parts[1])); }
                                row.onmousedown = function (ev) {
                                    ev.preventDefault(); ev.stopPropagation();
                                    closeMenu(); entry.fn();
                                };
                                dd.appendChild(row);
                            })(it);
                        }
                        item.appendChild(dd);
                        openMenuEl = dd;
                    };
                    menubar.appendChild(item);
                })(mName);
            }
        }
        root.appendChild(menubar);

        /* toolbar */
        var toolbar = el("div", "vs-toolbar");
        function toolBtn(label, title, fn, extraCls) {
            var b = el("button", "vs-tool" + (extraCls ? " " + extraCls : ""), label);
            b.title = title;
            b.onclick = fn;
            toolbar.appendChild(b);
            return b;
        }
        toolBtn("New", "New File (Ctrl+N)", function () { promptNewFile(); });
        toolBtn("Save", "Save (Ctrl+S)", function () { saveActive(); });
        toolbar.appendChild(el("span", "vs-tool-sep"));
        toolBtn("Build", "Build Solution (F6)", function () { build(false); });
        toolBtn("▶ Run", "Start Without Debugging (Ctrl+F5)", function () { run(); }, "vs-tool-run");
        toolbar.appendChild(el("span", "vs-tool-flex"));
        var projLabel = el("span", "vs-tool-proj", "");
        toolbar.appendChild(projLabel);
        root.appendChild(toolbar);

        /* main region */
        var main = el("div", "vs-main");

        /* solution explorer */
        var explorer = el("div", "vs-explorer");
        var expTitle = el("div", "vs-exp-title", "Solution Explorer");
        explorer.appendChild(expTitle);
        var tree = el("div", "vs-tree");
        explorer.appendChild(tree);
        main.appendChild(explorer);

        function togglePane(node) {
            node.style.display = node.style.display === "none" ? "" : "none";
        }

        function renderTree() {
            tree.innerHTML = "";
            var solNode = el("div", "tree-node tree-sol",
                "Solution '" + solution.name + "' (" + solution.projects.length + " projects)");
            tree.appendChild(solNode);
            for (var i = 0; i < solution.projects.length; i++) {
                (function (proj, idx) {
                    var pNode = el("div", "tree-node tree-proj" +
                        (idx === solution.startupIndex ? " tree-startup" : ""), proj.name);
                    pNode.title = idx === solution.startupIndex ? "Startup project" : "Click to make startup project";
                    pNode.onmousedown = function () {
                        if (idx !== solution.startupIndex) {
                            solution.startupIndex = idx;
                            renderTree();
                            updateProjLabel();
                        }
                    };
                    tree.appendChild(pNode);
                    for (var j = 0; j < proj.files.length; j++) {
                        (function (file) {
                            var fNode = el("div", "tree-node tree-file tree-" + file.language, file.name);
                            fNode.onmousedown = function () { openFile(proj, file); };
                            tree.appendChild(fNode);
                        })(proj.files[j]);
                    }
                })(solution.projects[i], i);
            }
        }

        function updateProjLabel() {
            projLabel.textContent = "Startup: " + solution.projects[solution.startupIndex].name;
        }

        /* editor center column */
        var center = el("div", "vs-center");
        var tabsEl = el("div", "vs-tabs");
        center.appendChild(tabsEl);

        var editorWrap = el("div", "vs-editor-wrap");
        var gutter = el("div", "vs-gutter");
        var gutterPre = el("pre", "vs-gutter-pre");
        gutter.appendChild(gutterPre);
        var editorScroll = el("div", "vs-editor-scroll");
        var hl = el("pre", "vs-highlight");
        var input = el("textarea", "vs-input");
        input.setAttribute("wrap", "off");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("autocapitalize", "off");
        editorScroll.appendChild(hl);
        editorScroll.appendChild(input);
        editorWrap.appendChild(gutter);
        editorWrap.appendChild(editorScroll);
        center.appendChild(editorWrap);
        main.appendChild(center);
        root.appendChild(main);

        /* bottom panes */
        var bottom = el("div", "vs-bottom");
        var bottomTabs = el("div", "vs-bottom-tabs");
        var panes = {};
        var paneNames = { output: "Output", errors: "Error List", emulator: "Device Emulator" };
        var paneOrder = ["output", "errors", "emulator"];
        for (var pi = 0; pi < paneOrder.length; pi++) {
            (function (key) {
                var t = el("button", "vs-btab", paneNames[key]);
                t.onclick = function () { showBottomTab(key); };
                bottomTabs.appendChild(t);
                panes[key] = el("div", "vs-pane vs-pane-" + key);
                bottom.appendChild(panes[key]);
            })(paneOrder[pi]);
        }
        root.appendChild(bottom);

        function showBottomTab(key) {
            for (var k in panes) {
                if (panes.hasOwnProperty(k)) {
                    panes[k].style.display = k === key ? "block" : "none";
                }
            }
            var tabs = bottomTabs.childNodes;
            for (var i = 0; i < tabs.length && i < paneOrder.length; i++) {
                tabs[i].className = "vs-btab" + (paneOrder[i] === key ? " vs-btab-on" : "");
            }
            bottom.style.display = "";
        }

        /* output pane */
        var outputBox = el("div", "vs-output");
        panes.output.appendChild(outputBox);
        function out(line) {
            outputBox.appendChild(el("div", "vs-out-line", line));
            outputBox.scrollTop = outputBox.scrollHeight;
        }
        function cleanOutput() {
            outputBox.innerHTML = "";
            out("Cleaned.");
        }

        /* error list pane */
        var errTable = el("div", "vs-errtable");
        panes.errors.appendChild(errTable);
        function showErrors(list) {
            errTable.innerHTML = "";
            var head = el("div", "vs-err-row vs-err-head");
            head.appendChild(el("span", "vs-err-c", ""));
            head.appendChild(el("span", "vs-err-desc", "Description"));
            head.appendChild(el("span", "vs-err-file", "File"));
            head.appendChild(el("span", "vs-err-line", "Line"));
            errTable.appendChild(head);
            if (list.length === 0) {
                var none = el("div", "vs-err-row");
                none.appendChild(el("span", "vs-err-c", ""));
                none.appendChild(el("span", "vs-err-desc", "No errors — ship it."));
                errTable.appendChild(none);
                return;
            }
            for (var i = 0; i < list.length; i++) {
                (function (e) {
                    var row = el("div", "vs-err-row");
                    row.appendChild(el("span", "vs-err-c", "✕"));
                    row.appendChild(el("span", "vs-err-desc", e.code + ": " + e.text));
                    row.appendChild(el("span", "vs-err-file", e.file.name));
                    row.appendChild(el("span", "vs-err-line", e.line > 0 ? String(e.line) : "—"));
                    row.onmousedown = function () {
                        openFile(e.project, e.file);
                        if (e.line > 0) { gotoLine(e.line); }
                    };
                    errTable.appendChild(row);
                })(list[i]);
            }
        }

        /* emulator pane */
        var emuWrap = el("div", "vs-emu-wrap");
        var phone = el("div", "emu-phone");
        var emuTitle = el("div", "emu-title", "webOS Emulator");
        var emuScreen = el("div", "emu-screen");
        var emuGesture = el("div", "emu-gesture");
        var emuDot = el("div", "emu-gesture-dot");
        emuGesture.appendChild(emuDot);
        phone.appendChild(emuTitle);
        phone.appendChild(emuScreen);
        phone.appendChild(emuGesture);
        var emuSide = el("div", "emu-side");
        var emuLog = el("div", "emu-log");
        emuSide.appendChild(el("div", "emu-side-title", "Console"));
        emuSide.appendChild(emuLog);
        emuWrap.appendChild(phone);
        emuWrap.appendChild(emuSide);
        panes.emulator.appendChild(emuWrap);
        function emuPrint(msg, cls) {
            var d = el("div", "emu-log-line" + (cls ? " " + cls : ""), msg);
            emuLog.appendChild(d);
            emuLog.scrollTop = emuLog.scrollHeight;
        }

        /* status bar */
        var statusbar = el("div", "vs-statusbar");
        var stMsg = el("span", "vs-st-msg", "Ready");
        var stPos = el("span", "vs-st-pos", "Ln 1, Col 1");
        var stFile = el("span", "vs-st-file", "");
        statusbar.appendChild(stMsg);
        statusbar.appendChild(el("span", "vs-st-flex"));
        statusbar.appendChild(stFile);
        statusbar.appendChild(stPos);
        root.appendChild(statusbar);

        container.appendChild(root);

        /* ---- editor behavior ------------------------------------------ */

        function refreshEditor() {
            if (!activeTab) {
                input.value = "";
                hl.innerHTML = "";
                gutterPre.textContent = "";
                stFile.textContent = "";
                return;
            }
            var code = input.value; // source of truth while editing
            hl.innerHTML = highlight(code) + "\n";
            var n = code.split("\n").length;
            var nums = [];
            for (var i = 1; i <= n; i++) { nums.push(i); }
            gutterPre.textContent = nums.join("\n");
            stFile.textContent = activeTab.file.name + "   ";
        }

        function syncScroll() {
            hl.style.transform = "translate(" + (-input.scrollLeft) + "px," + (-input.scrollTop) + "px)";
            gutterPre.style.transform = "translateY(" + (-input.scrollTop) + "px)";
        }

        function updatePos() {
            var upto = input.value.slice(0, input.selectionStart);
            var lines = upto.split("\n");
            stPos.textContent = "Ln " + lines.length + ", Col " +
                (lines[lines.length - 1].length + 1);
        }

        input.addEventListener("input", function () {
            if (activeTab) {
                activeTab.file.content = input.value;
                activeTab.dirty = true;
                renderTabs();
            }
            refreshEditor();
            updatePos();
        }, false);
        input.addEventListener("scroll", syncScroll, false);
        input.addEventListener("keyup", updatePos, false);
        input.addEventListener("click", updatePos, false);
        input.addEventListener("keydown", function (e) {
            if (e.keyCode === 9) {  // Tab
                e.preventDefault();
                var s = input.selectionStart, en = input.selectionEnd;
                input.value = input.value.slice(0, s) + "    " + input.value.slice(en);
                input.selectionStart = input.selectionEnd = s + 4;
                if (activeTab) { activeTab.file.content = input.value; activeTab.dirty = true; }
                refreshEditor();
            }
        }, false);

        /* ---- tabs ------------------------------------------------------ */

        function renderTabs() {
            tabsEl.innerHTML = "";
            for (var i = 0; i < openTabs.length; i++) {
                (function (tab) {
                    var t = el("div", "vs-tab" + (tab === activeTab ? " vs-tab-on" : ""));
                    t.appendChild(el("span", "vs-tab-name", tab.file.name + (tab.dirty ? "*" : "")));
                    var x = el("span", "vs-tab-x", "×");
                    x.onmousedown = function (e) {
                        e.stopPropagation();
                        closeTab(tab);
                    };
                    t.appendChild(x);
                    t.onmousedown = function () { activateTab(tab); };
                    tabsEl.appendChild(t);
                })(openTabs[i]);
            }
        }

        function activateTab(tab) {
            if (activeTab && activeTab.dirty) { activeTab.file.content = input.value; }
            activeTab = tab;
            input.value = tab.file.content;
            tab.dirty = false;
            renderTabs();
            refreshEditor();
            updatePos();
        }

        function closeTab(tab) {
            var idx = arrIndexOf(openTabs, tab);
            if (idx >= 0) { openTabs.splice(idx, 1); }
            if (tab === activeTab) {
                activeTab = openTabs.length ? openTabs[Math.max(0, idx - 1)] : null;
                input.value = activeTab ? activeTab.file.content : "";
            }
            renderTabs();
            refreshEditor();
        }

        function openFile(project, file) {
            for (var i = 0; i < openTabs.length; i++) {
                if (openTabs[i].file === file) { activateTab(openTabs[i]); return; }
            }
            var tab = { project: project, file: file, dirty: false };
            openTabs.push(tab);
            activateTab(tab);
        }

        function gotoLine(line) {
            var lines = input.value.split("\n");
            var pos = 0;
            for (var i = 0; i < Math.min(line - 1, lines.length); i++) {
                pos += lines[i].length + 1;
            }
            input.focus();
            input.selectionStart = input.selectionEnd = pos;
            updatePos();
        }

        function saveActive() {
            if (!activeTab) { return; }
            activeTab.file.content = input.value;
            activeTab.dirty = false;
            saveSolution(host.store, solution);
            renderTabs();
            stMsg.textContent = activeTab.file.name + " saved";
            setTimeout(function () { stMsg.textContent = "Ready"; }, 1500);
        }

        function saveAll() {
            if (activeTab) { activeTab.file.content = input.value; activeTab.dirty = false; }
            for (var i = 0; i < openTabs.length; i++) { openTabs[i].dirty = false; }
            saveSolution(host.store, solution);
            renderTabs();
            stMsg.textContent = "All files saved";
            setTimeout(function () { stMsg.textContent = "Ready"; }, 1500);
        }

        /* ---- new file dialog ------------------------------------------- */

        function promptNewFile() {
            host.newFileDialog(function (name) {
                var lang = /\.json$/i.test(name) ? "json" :
                    /\.html?$/i.test(name) ? "html" :
                    /\.txt$/i.test(name) ? "text" : "javascript";
                var proj = solution.projects[solution.startupIndex];
                proj.files.push({ name: name, language: lang, content: "" });
                renderTree();
                openFile(proj, proj.files[proj.files.length - 1]);
            });
        }

        function cycleStartup() {
            solution.startupIndex = (solution.startupIndex + 1) % solution.projects.length;
            renderTree();
            updateProjLabel();
            out("Startup project: " + solution.projects[solution.startupIndex].name);
        }

        /* ---- build & run ----------------------------------------------- */

        function build(rebuild) {
            saveSolution(host.store, solution);
            var proj = solution.projects[solution.startupIndex];
            showBottomTab("output");
            out((rebuild ? "------ Rebuild All" : "------ Build") +
                " started: Project: " + proj.name + ", Configuration: Debug webOS ------");
            var errors = [];
            for (var i = 0; i < proj.files.length; i++) {
                var f = proj.files[i];
                if (f.language !== "javascript") { continue; }
                out("  Compiling " + f.name + "...");
                var probs = checkFile(f);
                for (var j = 0; j < probs.length; j++) {
                    probs[j].file = f;
                    probs[j].project = proj;
                    errors.push(probs[j]);
                    out("  " + f.name + "(" + probs[j].line + "): error " +
                        probs[j].code + ": " + probs[j].text);
                }
            }
            if (errors.length === 0) {
                out("========== Build: 1 succeeded, 0 failed, 0 up-to-date, 0 skipped ==========");
                stMsg.textContent = "Build succeeded";
            } else {
                out("========== Build: 0 succeeded, 1 failed, 0 up-to-date, 0 skipped ==========");
                stMsg.textContent = "Build failed";
            }
            showErrors(errors);
            return errors.length === 0;
        }

        var enyo = {
            _kinds: [],
            kind: function (spec) {
                if (spec && spec.name) { enyo._kinds.push(spec.name); }
            },
            list: function () { return enyo._kinds.slice(); },
            create: function () { return {}; }
        };

        function run() {
            if (!build(false)) {
                showBottomTab("errors");
                return;
            }
            var proj = solution.projects[solution.startupIndex];
            var src = "";
            for (var i = 0; i < proj.files.length; i++) {
                if (proj.files[i].language === "javascript") {
                    src += proj.files[i].content + "\n";
                }
            }
            var device = makeDevice(emuScreen, function (m) { emuPrint(m, "emu-err"); });
            var fakeConsole = {
                log: function (m) { emuPrint("» " + m); },
                warn: function (m) { emuPrint("! " + m, "emu-warn"); },
                error: function (m) { emuPrint("✕ " + m, "emu-err"); }
            };
            emuScreen.innerHTML = "";
            emuLog.innerHTML = "";
            emuTitle.textContent = proj.name;
            showBottomTab("emulator");
            try {
                var fn = new Function("device", "console", "enyo",
                    src + "\nif (typeof main === 'function') { main(device); } else { console.log('no main() defined'); }");
                fn(device, fakeConsole, enyo);
                out("Application '" + proj.name + "' started on emulator.");
            } catch (e) {
                emuPrint("runtime error: " + e.message, "emu-err");
                out("Runtime error: " + e.message);
            }
        }

        /* ---- keyboard (keyCode for legacy WebKit) ----------------------- */

        root.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); saveActive(); }       // Ctrl+S
            if (e.ctrlKey && e.keyCode === 78) { e.preventDefault(); promptNewFile(); }    // Ctrl+N
            if (e.keyCode === 117) { e.preventDefault(); build(false); }                   // F6
            if (e.ctrlKey && e.keyCode === 116) { e.preventDefault(); run(); }             // Ctrl+F5
        }, false);

        /* ---- boot -------------------------------------------------------- */

        renderTree();
        updateProjLabel();
        showBottomTab("output");
        renderTabs();
        var first = solution.projects[0].files[0];
        openFile(solution.projects[0], first);
        out("Visual Studio for webOS ready.");
        out("Tip: F6 builds, Ctrl+F5 runs on the emulated Pre.");

        return { root: root };
    }

    return { create: create };
})();
