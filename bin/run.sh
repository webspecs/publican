#!/bin/bash

export RUNDIR="/srv/webplatform/specs"

cd $RUNDIR

node_modules/forever/bin/forever start $RUNDIR/bin/server.js
node_modules/forever/bin/forever --fifo logs 0