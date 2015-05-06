SHELL := bash

default: run

deps:
		git clone -b webspecs https://github.com/webspecs/bikeshed.git bikeshed
		pip install --user --editable bikeshed
		npm install

docker-build:
		docker build -t webspecs/publican .

docker-bash:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002 webspecs/publican

docker-run:
		mkdir -p $(CURDIR)/data/{logs,publish,queue}
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002 webspecs/publican bin/run.sh
		docker ps | grep publican

tail:
		tail -f data/logs/all.log

run: docker-run tail

