SHELL := bash

default: deps

clone-bikeshed: datadirs
		git clone -b webspecs https://github.com/webspecs/bikeshed.git bikeshed

datadirs:
		mkdir -p $(CURDIR)/data/{queue,gits,logs,temp}

# Make sure Dockerfile has equivalent at note about `make deps`
deps:
		pip install --user --editable bikeshed
		npm install

docker-build:
		docker build -t webspecs/publican .

docker-bash:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002:7002 webspecs/publican:latest

docker-run:
		docker run -it --rm -v "$(CURDIR)/data":/srv/webplatform/specs/data -p 7002:7002 webspecs/publican:latest bin/run.sh

