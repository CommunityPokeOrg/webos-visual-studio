/* Minimal PDL.h stub for host-side syntax checks (tools/pdk-build.sh
 * --host-check). NOT for linking or running — only for gcc -fsyntax-only. */
#ifndef PDL_STUB_H
#define PDL_STUB_H

#ifdef __cplusplus
extern "C" {
#endif

typedef enum { PDL_FALSE = 0, PDL_TRUE = 1 } PDL_bool;
typedef int PDL_Err;
#define PDL_SUCCESS 0

PDL_Err  PDL_Init(unsigned int flags);
void     PDL_Quit(void);
PDL_bool PDL_IsPlugin(void);

#ifdef __cplusplus
}
#endif
#endif
