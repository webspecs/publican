SHELL := bash

default: run

build:
		docker build -t webspecs/publican .

run:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data webspecs/publican

