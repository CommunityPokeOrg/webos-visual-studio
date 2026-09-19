/* PDK standalone application skeleton — SDL 1.2 on the PDL runtime.
 *
 * Every PDK app lives inside the Palm Device Library (PDL) lifecycle:
 * PDL_Init brings the process up inside LunaSysMgr, then the app owns a
 * raw framebuffer/GL context until PDL_Quit.
 */

#include <SDL.h>
#include "PDL.h"

int main(int argc, char **argv)
{
    SDL_Surface *screen;
    SDL_Event event;
    int running = 1;
    int ticks = 0;

    if (PDL_Init(0) != PDL_SUCCESS) {
        return 1;
    }

    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        PDL_Quit();
        return 1;
    }

    screen = SDL_SetVideoMode(0, 0, 32, SDL_FULLSCREEN | SDL_DOUBLEBUF);
    if (!screen) {
        SDL_Quit();
        PDL_Quit();
        return 1;
    }

    while (running) {
        /* Drain the event queue; the PDK delivers touch as mouse events
         * and the back gesture as an SDL key. */
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT ||
                (event.type == SDL_KEYDOWN && event.key.keysym.sym == SDLK_ESCAPE)) {
                running = 0;
            }
        }

        /* Simple animated fill so there is something on screen. */
        ticks++;
        SDL_FillRect(screen, NULL,
            SDL_MapRGB(screen->format, (ticks % 60) * 4, 48, 96));
        SDL_Flip(screen);

        SDL_Delay(16);
    }

    SDL_Quit();
    PDL_Quit();
    return 0;
}
