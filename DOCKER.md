# Publican

The set of tools used to automate publishing in the WebSpecs project



## Run in Docker

If you have [Docker installed](https://docs.docker.com/installation/) and running, you can run it in a few commands.

```bash
docker pull webspecs/publican:latest
docker run -it --rm -p 7002:7002 -v "$(pwd)/data":/srv/webplatform/specs/data -v "$(pwd)/spec-data":/opt/bikeshed/bikeshed/spec-data webspecs/publican:latest bin/run.sh
```

If you want to run with your own customizations, you’d have to do also have [**Docker Compose** installed](https://docs.docker.com/compose/install/) and do the following.

Follow the instructions in **Run using _Docker Compose_** in [the registry description instructions](https://registry.hub.docker.com/u/webspecs/publican/)



## Build Docker container

If you changed project source, you’ll need to build another docker container.

The following takes into account that you can run `docker` commands.

```bash
make clone-bikeshed
make docker-build
make docker-run
```

Which extends into something similar to:

```
docker run -it --rm -p 7002:7002 \
           -v /Users/renoirb/workspaces/webplatform/service-publican/repo/data:/srv/webplatform/specs/data \
           -v /Users/renoirb/workspaces/webplatform/service-publican/repo/spec-data:/opt/bikeshed/bikeshed/spec-data \
           webspecs/publican:latest bin/run.sh
```

... notice that the `-v /full/path/host:/full/path/container` option requires FULL path in both sides of the column


Refer to the appropriate documentation if you want to [install](https://docs.docker.com/installation/#installation) and run this project from a Docker container.


## Run an instance locally

Run a container, and send a hook call

        make docker-run

On another terminal tab, send a hook;

        curl -H "Content-Type: application/json" -XPOST localhost:7002/hook -d '{"base_ref":"master","repository":{"name":"assets","owner":{"name":"webspecs"}}}'


you should see something like;

        {"ok":true,"details":"Queued 1431380611165-28770219 for processing."}

And in the container, you’d see;

![publican-run-hook](https://cloud.githubusercontent.com/assets/296940/7575805/f18cb1d2-f805-11e4-8ec3-dba68dae7785.png)



## Enter the container shell

You can initialize an empty workspace using `publican.js init`, it’ll write in `data/` that should already be mounted through the `Makefile`.

Its also useful to understand what’s happening behind the scenes.

        make docker-bash

![publican-init](https://cloud.githubusercontent.com/assets/296940/7575777/b5a76176-f805-11e4-99e7-3a7c58dd304a.png)



## Push Docker container to Docker Hub registry

The Docker registry is basically a storage service of docker container states from which we can pull and run from it.
It saves us to rebuild the container on every server that would run the container.

Docker uses a semantic similar to git, a container can be commited and pushed to a repository. That’s what we’ll do here.

Rever to [Docker command line "commit" documentation](http://docs.docker.com/reference/commandline/cli/#commit-a-container) for further details.

This project Docker registry entry is at [registry.hub.docker.com/u/**webspecs/publican**](https://registry.hub.docker.com/u/webspecs/publican/).

To commit a container, we need a running one. Once you have one, you can commit.

Get current running container; that’s what we commit.

```bash
docker ps

CONTAINER ID        IMAGE                             COMMAND                CREATED             STATUS              PORTS                    NAMES
3cce48d3b30c        servicepublican_publican:latest   "/bin/bash /srv/webp   11 minutes ago      Up 11 minutes       0.0.0.0:8002->7002/tcp   sandboxpublican_web_1"
```

If you have write access as a *collaborator* to the *webspecs* organization within Docker hub; Commit and push

```bash
docker commit 3cce48d3b30c
docker push webspecs/publican
```

Done.



## Run from Docker composer

TODO, see notes in [**webspecs/publican**](https://registry.hub.docker.com/u/webspecs/publican/) Docker hub description.

