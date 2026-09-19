/* Assistant for the "Add New File" dialog (views/dialogs/newfile-dialog.html). */

function NewFileDialogAssistant(sceneController, onName) {
    this.sceneController = sceneController;
    this.onName = onName;
}

NewFileDialogAssistant.prototype.setup = function (widget) {
    this.widget = widget;
    this.controller = this.sceneController;
    var self = this;

    var nameField = this.controller.get("newfile-name");
    if (nameField) {
        nameField.focus();
        if (nameField.select) { nameField.select(); }
    }
    Mojo.Event.listen(this.controller.get("newfile-ok"), Mojo.Event.tap,
        function () { self.done(true); });
    Mojo.Event.listen(this.controller.get("newfile-cancel"), Mojo.Event.tap,
        function () { self.done(false); });
    Mojo.Event.listen(nameField, "keydown", function (e) {
        if (e.keyCode === 13) { self.done(true); }          /* Enter  */
        else if (e.keyCode === 27) { self.done(false); }    /* Escape */
    });
};

NewFileDialogAssistant.prototype.done = function (accept) {
    var name = "";
    var field = this.controller.get("newfile-name");
    if (accept && field) {
        name = field.value.replace(/^\s+|\s+$/g, "");
    }
    if (this.widget && this.widget.mojo && this.widget.mojo.close) {
        this.widget.mojo.close();
    }
    if (accept && name && this.onName) {
        this.onName(name);
    }
};
