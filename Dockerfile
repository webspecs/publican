#
# Publican Docker runner
#
# See also:
#   * https://github.com/nodesource/docker-node/blob/master/ubuntu/trusty/node/0.10.36/Dockerfile

MAINTAINER renoirb 'https://github.com/renoirb'

FROM nodesource/trusty:0.10.36

RUN mkdir -p /srv/webplatform/specs/queue
RUN mkdir -p /srv/webplatform/specs/data/logs

RUN /usr/sbin/useradd --home-dir /srv/webplatform/specs --shell /bin/bash nonroot
RUN /usr/sbin/adduser nonroot sudo

COPY . /srv/webplatform/specs/

RUN chown -R nonroot /usr/local/
RUN chown -R nonroot /usr/lib/
RUN chown -R nonroot /usr/bin/
RUN chown -R nonroot /srv/webplatform/specs/

ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /srv/webplatform/specs

USER nonroot
WORKDIR /srv/webplatform/specs

ENTRYPOINT ["/bin/bash", "/srv/webplatform/specs/bin/run.sh"]

