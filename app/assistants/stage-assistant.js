/* Stage assistant — the app entry point for a Mojo application.
 * webOS instantiates StageAssistant on the app's stage and calls setup(). */

function StageAssistant() {
}

StageAssistant.prototype.setup = function () {
    this.controller.pushScene("main");
};
