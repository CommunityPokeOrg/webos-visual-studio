/* Main scene — embeds the PDK plugin as a Palm plug-in object.
 * The plugin binary is packaged in the .ipk and drawn into the object
 * element's region by the runtime (webOS 2.x+ hybrid model). */

function MainAssistant() {
}

MainAssistant.prototype.setup = function () {
    /* Nothing to wire: the plugin draws itself. Mojo chrome (header,
     * menus) lives around the plug-in area. */
};
