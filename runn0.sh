#!/bin/bash

# SUBST N: $(realpath.exe ./jetstream-n0/)

nats-server.exe -c /c/repos/nats-io-examples/jetstream-n0/config-with-operator-and-sys-account-and-jetstream
