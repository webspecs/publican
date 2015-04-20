#
# Publican Docker runner
#
# See also:
#   * https://github.com/nodesource/docker-node/blob/master/ubuntu/trusty/node/0.10.36/Dockerfile

FROM nodesource/trusty:0.10.36

MAINTAINER Renoir Boulanger <renoir@w3.org>

RUN mkdir -p /srv/webplatform/specs/queue
RUN mkdir -p /srv/webplatform/specs/data/logs

RUN apt-get update \
    && apt-get install -y --force-yes git

RUN /usr/sbin/useradd --home-dir /srv/webplatform/specs --shell /bin/bash nonroot
RUN /usr/sbin/adduser nonroot sudo

COPY . /srv/webplatform/specs/

RUN chown -R nonroot:nonroot /srv/webplatform/specs/

USER nonroot
WORKDIR /srv/webplatform/specs

ENV HOME /srv/webplatform/specs
ENV GIT_DISCOVERY_ACROSS_FILESYSTEM true

RUN npm install

EXPOSE 7002

# Allow cli entry for debug, but make sure docker-compose.yml uses "command: bin/run.sh"
ENTRYPOINT ["/bin/bash"]

# Note leftover: Ideally, it should exclusively run
#ENTRYPOINT ["/bin/bash", "/srv/webplatform/specs/bin/run.sh"]

# Note leftover: What it ends up doing
#CMD ["node_modules/forever/bin/forever", "--fifo", "logs", "0"]
