# Makefile for a standalone Palm PDK (native) application.
#
# Expects the HP/Palm PDK installed with its cross toolchain on PATH, or
# PalmPDK pointing at the PDK root, e.g.:
#   export PalmPDK=/opt/PalmPDK
#   export PATH=$PalmPDK/arm-gcc/bin:$PATH
#
# Targets:
#   make            builds the device binary ($(TARGET))
#   make host-check syntax-checks the sources with the host compiler
#                   (not a device binary — see ../README)

TARGET   = pdkapp

CC      ?= arm-none-linux-gnueabi-gcc
STRIP   ?= arm-none-linux-gnueabi-strip

# PDL headers/libs live in the PDK. SDL 1.2 and OpenGL ES 1.1/2.0 ship with it.
PalmPDK ?= /opt/PalmPDK
DEVICE_INCLUDE = -I$(PalmPDK)/include -I$(PalmPDK)/include/SDL
DEVICE_LIB     = -L$(PalmPDK)/device/lib -Wl,--allow-shlib-undefined

CFLAGS  = -O2 -Wall $(DEVICE_INCLUDE)
LIBS    = $(DEVICE_LIB) -lSDL -lGLESv2 -lpdl -lm

HOST_STUBS ?= ../../tools/host-stub

SRC     = src/main.c
OBJ     = $(SRC:.c=.o)

$(TARGET): $(OBJ)
	$(CC) -o $@ $(OBJ) $(LIBS)
	$(STRIP) $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Host-side syntax check against tools/host-stub headers
# (requires gcc; NOT a device binary — see ../README).
host-check:
	gcc -fsyntax-only -Wall -I$(HOST_STUBS) $(SRC)
	@echo "host-check: syntax OK (no ARM binary produced)"

clean:
	rm -f $(OBJ) $(TARGET)

.PHONY: clean host-check
