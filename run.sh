#!/bin/bash

IFACE=wlxec086b082b2e
HTTP_PORT=80
GPSD_PORT=3115
GPSD_DEVICE=/dev/ttyACM0

sudo $(which node) server \
	--iface $IFACE \
	--port $HTTP_PORT \
	--dns \
	--gpsd \
	--gpsd-port $GPSD_PORT \
	--gpsd-device $GPSD_DEVICE

