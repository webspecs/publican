SHELL := bash

default: run

build:
		docker build -t webspecs/publican .

run:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002 webspecs/publican

tail:
		tail -f data/logs/all.log
