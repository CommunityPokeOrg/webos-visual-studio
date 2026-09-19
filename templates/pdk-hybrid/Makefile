# Makefile for the native half of a hybrid Mojo + PDK application.
# Output lands in native/ where palm-package picks it up into the .ipk.
# See ../pdk-standalone/Makefile for toolchain conventions.

TARGET   = native/plugin

CC      ?= arm-none-linux-gnueabi-gcc
STRIP   ?= arm-none-linux-gnueabi-strip

PalmPDK ?= /opt/PalmPDK
DEVICE_INCLUDE = -I$(PalmPDK)/include -I$(PalmPDK)/include/SDL
DEVICE_LIB     = -L$(PalmPDK)/device/lib -Wl,--allow-shlib-undefined

CFLAGS  = -O2 -Wall $(DEVICE_INCLUDE)
LIBS    = $(DEVICE_LIB) -lSDL -lpdl -lm

HOST_STUBS ?= ../../tools/host-stub

SRC     = src/plugin.c
OBJ     = $(SRC:.c=.o)

$(TARGET): $(OBJ)
	mkdir -p native
	$(CC) -o $@ $(OBJ) $(LIBS)
	$(STRIP) $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

host-check:
	gcc -fsyntax-only -Wall -I$(HOST_STUBS) $(SRC)
	@echo "host-check: syntax OK (no ARM binary produced)"

clean:
	rm -f $(OBJ) $(TARGET)
	rmdir native 2>/dev/null || true

.PHONY: clean host-check
