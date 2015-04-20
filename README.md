# Publican

The set of tools used to automate publishing in the WebSpecs project



## Run in Docker

If you have [Docker installed](https://docs.docker.com/installation/) and running, you can run it in a few commands.

```bash
docker pull webspecs/publican
docker run -it --rm -p 7002:7002 webspecs/publican
```

If you want to run with your own customizations, you’d have to do also have [**Docker Compose** installed](https://docs.docker.com/compose/install/) and do the following.

Follow the instructions in **Run using _Docker Compose_** in [the registry description instructions](https://registry.hub.docker.com/u/webspecs/publican/)



## Build Docker container

If you changed project source, you’ll need to build another docker container.

The following takes into account that you can run `docker` commands.

```bash
git checkout task-based
make build
make
```

Please refer to the appropriate documentation if you want to [install](https://docs.docker.com/installation/#installation) and run this project from a Docker container.



## Push Docker container to Docker Hub registry

We can quickly run a compiled container from the Docker Hub which [acts in a similar way as **git** would](http://docs.docker.com/reference/commandline/cli/#commit-a-container).

This project Docker registry entry is at [registry.hub.docker.com/u/**webspecs/publican**](https://registry.hub.docker.com/u/webspecs/publican/).

To do so, run a container, commit and push. More detailed instructions in [Docker docs at the *commandline* section](http://docs.docker.com/reference/commandline/cli/#commit-a-container)

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

