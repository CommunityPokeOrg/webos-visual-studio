/* Sample projects that ship with Visual Studio for webOS.
 * Kept in ES5 so the whole app can run on era-appropriate WebKit.
 * Project `kind`: "mojo" (JS app), "pdk" (native C/C++ via the Palm PDK
 * toolchain), or "hybrid" (Mojo shell + embedded PDK plugin). */

var VS_SAMPLES = [
  {
    name: "HelloWebOS",
    kind: "mojo",
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
    kind: "mojo",
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
  ,{
    name: "NativeCube",
    kind: "pdk",
    description: "Standalone PDK app: PDL lifecycle + SDL 1.2 framebuffer loop.",
    files: [
      {
        name: "main.c",
        language: "c",
        content: [
          "/* NativeCube — standalone Palm PDK application.",
          " * Build with the arm-none-linux-gnueabi toolchain.",
          " */",
          "",
          "#include <SDL.h>",
          "#include \"PDL.h\"",
          "",
          "int main(int argc, char **argv)",
          "{",
          "    SDL_Surface *screen;",
          "    SDL_Event event;",
          "    int running = 1;",
          "",
          "    PDL_Init(0);",
          "    SDL_Init(SDL_INIT_VIDEO);",
          "    screen = SDL_SetVideoMode(0, 0, 32, SDL_FULLSCREEN);",
          "",
          "    while (running) {",
          "        while (SDL_PollEvent(&event)) {",
          "            if (event.type == SDL_QUIT) { running = 0; }",
          "        }",
          "        SDL_FillRect(screen, NULL, 0x203040);",
          "        SDL_Flip(screen);",
          "        SDL_Delay(16);",
          "    }",
          "",
          "    SDL_Quit();",
          "    PDL_Quit();",
          "    return 0;",
          "}",
          ""
        ].join("\n")
      },
      {
        name: "Makefile",
        language: "makefile",
        content: [
          "# NativeCube — PDK build. Requires the Palm PDK toolchain.",
          "TARGET = nativecube",
          "CC ?= arm-none-linux-gnueabi-gcc",
          "CFLAGS = -O2 -Wall -I$(PalmPDK)/include -I$(PalmPDK)/include/SDL",
          "LIBS = -L$(PalmPDK)/device/lib -Wl,--allow-shlib-undefined -lSDL -lpdl -lm",
          "",
          "$(TARGET): main.o",
          "\t$(CC) -o $@ $^ $(LIBS)",
          "",
          "clean:",
          "\trm -f *.o $(TARGET)",
          ""
        ].join("\n")
      },
      {
        name: "appinfo.json",
        language: "json",
        content: [
          "{",
          "    \"id\": \"com.communitypoke.nativecube\",",
          "    \"version\": \"1.0.0\",",
          "    \"vendor\": \"CommunityPoke\",",
          "    \"type\": \"pdk\",",
          "    \"main\": \"nativecube\",",
          "    \"title\": \"NativeCube\",",
          "    \"icon\": \"icon.png\"",
          "}",
          ""
        ].join("\n")
      }
    ]
  },
  {
    name: "HybridCounter",
    kind: "hybrid",
    description: "Mojo card + embedded PDK plugin (webOS 2.x hybrid model).",
    files: [
      {
        name: "plugin.c",
        language: "c",
        content: [
          "/* HybridCounter — PDK plugin embedded in a Mojo scene via",
          " * <object type=\"application/x-palm-plugin\">.",
          " * PDL_IsPlugin() is true here; the runtime scopes drawing to the",
          " * object region instead of the whole card. */",
          "",
          "#include <SDL.h>",
          "#include \"PDL.h\"",
          "",
          "int main(int argc, char **argv)",
          "{",
          "    PDL_Init(PDL_TRUE);",
          "    if (!PDL_IsPlugin()) { PDL_Quit(); return 1; }",
          "    SDL_Init(SDL_INIT_VIDEO);",
          "    /* plugin event loop ... */",
          "    SDL_Quit();",
          "    PDL_Quit();",
          "    return 0;",
          "}",
          ""
        ].join("\n")
      },
      {
        name: "main-scene.html",
        language: "html",
        content: [
          "<div class=\"palm-scene\">",
          "    <div class=\"palm-page-header\">HybridCounter</div>",
          "    <object type=\"application/x-palm-plugin\" id=\"plugin\"",
          "            width=\"320\" height=\"400\" params=\"native/plugin\"></object>",
          "</div>",
          ""
        ].join("\n")
      }
    ]
  }
];
