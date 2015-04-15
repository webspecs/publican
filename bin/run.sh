#!/bin/bash

export RUNDIR="/srv/webplatform/specs"

cd $RUNDIR

node_modules/forever/bin/forever start $RUNDIR/bin/server.js
