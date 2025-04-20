#!/bin/bash

# SUBST N: $(realpath.exe ./jetstream-n0/)

nats-server.exe -c /n/config-with-operator-and-sys-account-and-jetstream
