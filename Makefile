SHELL := bash

default: run

build:
		docker build -t webspecs/publican .

bash:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002 webspecs/publican

run:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002 webspecs/publican bin/run.sh
		docker ps | grep publican

tail:
		tail -f data/logs/all.log
