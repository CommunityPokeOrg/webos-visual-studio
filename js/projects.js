/* Sample projects that ship with Visual Studio for webOS.
 * Kept in ES5 so the whole app can run on era-appropriate WebKit. */

var VS_SAMPLES = [
  {
    name: "HelloWebOS",
    description: "Minimal webOS-style app: a label and a button on a Pre.",
    files: [
      {
        name: "app.js",
        language: "javascript",
        content: [
          "// HelloWebOS — Visual Studio for webOS sample",
          "// main(device) is the entry point; press Run (or Ctrl+F5) to launch.",
          "",
          "function main(device) {",
          "    device.setTitle(\"HelloWebOS\");",
          "    device.clear();",
          "    device.addLabel(\"Hello, webOS!\");",
          "    device.addLabel(\"Built with Visual Studio.\");",
          "",
          "    var taps = 0;",
          "    var counter = device.addLabel(\"Taps: 0\");",
          "    device.addButton(\"Tap me\", function () {",
          "        taps += 1;",
          "        counter.setText(\"Taps: \" + taps);",
          "        console.log(\"tap \" + taps);",
          "    });",
          "}",
          ""
        ].join("\n")
      },
      {
        name: "appinfo.json",
        language: "json",
        content: [
          "{",
          "    \"id\": \"com.communitypoke.hellowebos\",",
          "    \"version\": \"1.0.0\",",
          "    \"vendor\": \"CommunityPoke\",",
          "    \"type\": \"web\",",
          "    \"main\": \"index.html\",",
          "    \"title\": \"HelloWebOS\",",
          "    \"icon\": \"icon.png\"",
          "}",
          ""
        ].join("\n")
      },
      {
        name: "index.html",
        language: "html",
        content: [
          "<!DOCTYPE html>",
          "<html>",
          "<head>",
          "    <title>HelloWebOS</title>",
          "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
          "</head>",
          "<body>",
          "    <div id=\"app\"></div>",
          "    <script src=\"app.js\"></scr" + "ipt>",
          "</body>",
          "</html>",
          ""
        ].join("\n")
      }
    ]
  },
  {
    name: "CardDemo",
    description: "Demo of the emulated Enyo kind API.",
    files: [
      {
        name: "main.js",
        language: "javascript",
        content: [
          "// CardDemo — exercises the emulated Enyo surface.",
          "",
          "enyo.kind({",
          "    name: \"CardDemo.App\",",
          "    components: [",
          "        { kind: \"Label\", content: \"Enyo would live here\" }",
          "    ]",
          "});",
          "",
          "function main(device) {",
          "    device.setTitle(\"CardDemo\");",
          "    device.clear();",
          "    device.addLabel(\"Enyo kind registry:\");",
          "    device.addLabel(enyo.list().join(\", \"));",
          "    device.addButton(\"New card\", function () {",
          "        console.log(\"cards are managed by the shell\");",
          "    });",
          "}",
          ""
        ].join("\n")
      },
      {
        name: "appinfo.json",
        language: "json",
        content: [
          "{",
          "    \"id\": \"com.communitypoke.carddemo\",",
          "    \"version\": \"0.1.0\",",
          "    \"vendor\": \"CommunityPoke\",",
          "    \"type\": \"web\",",
          "    \"main\": \"index.html\",",
          "    \"title\": \"CardDemo\"",
          "}",
          ""
        ].join("\n")
      }
    ]
  }
];
