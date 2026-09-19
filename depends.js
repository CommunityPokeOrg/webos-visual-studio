/* Enyo-style dependency manifest. When packaged as a real webOS app
 * (palm-package), these sources are loaded in order. In the browser we
 * use plain <script> tags in index.html; this file documents the load
 * order for SDK tooling. */
enyo.depends(
    "js/projects.js",
    "js/ide.js",
    "js/webos.js"
);
