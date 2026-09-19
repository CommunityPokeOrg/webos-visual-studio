/* Minimal SDL.h (SDL 1.2) stub for host-side syntax checks
 * (tools/pdk-build.sh --host-check). NOT for linking or running. */
#ifndef SDL_STUB_H
#define SDL_STUB_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>   /* NULL */

#define SDL_INIT_VIDEO    0x00000020
#define SDL_FULLSCREEN    0x80000000
#define SDL_DOUBLEBUF     0x40000000
#define SDL_SWSURFACE     0x00000000
#define SDL_HWSURFACE     0x00000001

#define SDL_QUIT          0x0C
#define SDL_KEYDOWN       0x02
#define SDL_KEYUP         0x03
#define SDL_MOUSEBUTTONDOWN 0x05
#define SDL_MOUSEBUTTONUP   0x06
#define SDL_MOUSEMOTION     0x04

#define SDLK_ESCAPE       27

typedef unsigned int   Uint32;
typedef unsigned short Uint16;
typedef unsigned char  Uint8;

typedef struct SDL_Rect {
    short x, y;
    unsigned short w, h;
} SDL_Rect;

typedef struct SDL_Surface {
    Uint32 flags;
    void  *format;
    int    w, h;
    void  *pixels;
} SDL_Surface;

typedef struct SDL_keysym {
    int sym;
    int mod;
    Uint16 unicode;
} SDL_keysym;

typedef struct SDL_KeyboardEvent {
    Uint8 type;
    Uint8 which;
    Uint8 state;
    SDL_keysym keysym;
} SDL_KeyboardEvent;

typedef union SDL_Event {
    Uint8 type;
    SDL_KeyboardEvent key;
} SDL_Event;

int          SDL_Init(Uint32 flags);
void         SDL_Quit(void);
SDL_Surface *SDL_SetVideoMode(int width, int height, int bpp, Uint32 flags);
int          SDL_FillRect(SDL_Surface *dst, SDL_Rect *rect, Uint32 color);
int          SDL_Flip(SDL_Surface *screen);
int          SDL_PollEvent(SDL_Event *event);
void         SDL_Delay(Uint32 ms);
Uint32       SDL_MapRGB(void *format, Uint8 r, Uint8 g, Uint8 b);

#ifdef __cplusplus
}
#endif
#endif
