/* Main scene assistant — owns the single scene that hosts the IDE. */

function MainAssistant() {
}

MainAssistant.prototype.setup = function () {
    /* webOS app menu (top-left "Visual Studio" menu) */
    this.appMenuModel = {
        items: [
            { label: "About Visual Studio…", command: "do-about" }
        ]
    };
    this.controller.setupWidget(Mojo.Menu.appMenu,
        { omitDefaultItems: true }, this.appMenuModel);

    /* Solution persistence via the Palm cookie store (localStorage in the
     * browser shim). */
    var cookie = new Mojo.Model.Cookie("com.communitypoke.visualstudio.solution");
    var store = {
        load: function () {
            var v = cookie.get();
            return v === undefined ? null : v;
        },
        save: function (value) { cookie.put(value); }
    };

    var self = this;
    VisualStudio.create(this.controller.get("vs-root"), {
        store: store,
        showAbout: function () { self.showAbout(); },
        newFileDialog: function (onName) { self.showNewFileDialog(onName); }
    });
};

MainAssistant.prototype.showAbout = function () {
    this.controller.showAlertDialog({
        onChoose: function () { },
        title: "Visual Studio for webOS",
        message: "Version 10.0.webOS\nA community-built developer environment for " +
            "the card interface we never stopped loving.\n\nCommunityPokeOrg",
        choices: [{ label: "OK", value: "ok" }]
    });
};

MainAssistant.prototype.showNewFileDialog = function (onName) {
    this.controller.showDialog({
        template: "app/views/dialogs/newfile-dialog",
        assistant: new NewFileDialogAssistant(this.controller.getSceneController(), onName),
        preventCancel: false
    });
};

MainAssistant.prototype.handleCommand = function (event) {
    if (event.type === Mojo.Event.command) {
        if (event.command === "do-about") {
            this.showAbout();
        }
    }
};

MainAssistant.prototype.activate = function () { };
MainAssistant.prototype.deactivate = function () { };
MainAssistant.prototype.cleanup = function () { };
