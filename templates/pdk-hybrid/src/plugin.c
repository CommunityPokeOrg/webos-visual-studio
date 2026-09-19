/* PDK plugin — the native half of a hybrid Mojo + PDK app.
 *
 * When embedded via <object type="application/x-palm-plugin"> the binary
 * runs in plugin mode: PDL_IsPlugin() is true and the PDL event loop
 * delivers draw/touch events for the object's region instead of owning
 * the whole card.
 */

#include <SDL.h>
#include "PDL.h"

int main(int argc, char **argv)
{
    SDL_Surface *screen;
    SDL_Event event;
    int running = 1;

    if (PDL_Init(PDL_TRUE) != PDL_SUCCESS) {   /* plugin mode */
        return 1;
    }

    if (!PDL_IsPlugin()) {
        /* Launched standalone by accident — behave like a normal app. */
        PDL_Quit();
        return 1;
    }

    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        PDL_Quit();
        return 1;
    }

    /* In plugin mode the PDK sizes the surface to the <object> region. */
    screen = SDL_SetVideoMode(0, 0, 32, SDL_SWSURFACE);
    if (!screen) {
        SDL_Quit();
        PDL_Quit();
        return 1;
    }

    while (running) {
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                running = 0;
            }
        }
        SDL_FillRect(screen, NULL, SDL_MapRGB(screen->format, 32, 64, 128));
        SDL_Flip(screen);
        SDL_Delay(33);
    }

    SDL_Quit();
    PDL_Quit();
    return 0;
}
