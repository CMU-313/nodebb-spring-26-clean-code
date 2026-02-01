#!/bin/bash

redis-server --daemonize yes --bind 127.0.0.1 --port 6379

./nodebb start
./nodebb log