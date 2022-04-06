#!/bin/bash

# CHANGE ME!
# replace this with your WiFi interface name
# you can use `ifconfig` to find this name
WIFI_IFACE=wlan0

# CHANGE ME!
# use `which node` to get the absolute path to node
/usr/bin/node server \
--iface "$WIFI_IFACE" \
--port 80 \
--dns



