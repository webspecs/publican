#
# Publican Docker runner
#
# See also:
#   * https://github.com/nodesource/docker-node/blob/master/ubuntu/trusty/node/0.10.36/Dockerfile

FROM nodesource/trusty:0.10.36

MAINTAINER Renoir Boulanger <renoir@w3.org>

RUN mkdir -p /srv/webplatform/specs/data/queue && \
    mkdir -p /srv/webplatform/specs/data/logs && \
    mkdir -p /srv/webplatform/specs/bikeshed

RUN apt-get update && \
    apt-get install -yqq git python2.7 python-dev python-pip libxslt1-dev libxml2-dev zlib1g-dev && \
    pip install lxml

RUN /usr/sbin/useradd --home-dir /srv/webplatform/specs --shell /bin/bash nonroot && \
    /usr/sbin/adduser nonroot sudo

COPY . /srv/webplatform/specs/

RUN chown -R nonroot:nonroot /srv/webplatform/specs

USER nonroot

RUN git clone -b webspecs https://github.com/webspecs/bikeshed.git /srv/webplatform/specs/bikeshed && \
    pip install --user --editable /srv/webplatform/specs/bikeshed

WORKDIR /srv/webplatform/specs

ENV PATH /srv/webplatform/specs/bin:/srv/webplatform/specs/.local/bin:$PATH
ENV HOME /srv/webplatform/specs
ENV GIT_DISCOVERY_ACROSS_FILESYSTEM true

RUN chmod +x bin/run.sh && \
    npm install

EXPOSE 7002

# Allow cli entry for debug, but make sure docker-compose.yml uses "command: bin/run.sh"
ENTRYPOINT ["/bin/bash"]

# Note leftover: Ideally, it should exclusively run
#ENTRYPOINT ["/bin/bash", "/srv/webplatform/specs/bin/run.sh"]

# Note leftover: What it ends up doing
#CMD ["node_modules/forever/bin/forever", "--fifo", "logs", "0"]
