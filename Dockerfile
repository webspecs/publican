#
# Publican Docker runner
#
# See also:
#   * https://github.com/nodesource/docker-node/blob/master/ubuntu/trusty/node/0.10.36/Dockerfile

FROM nodesource/trusty:0.10.36

MAINTAINER Renoir Boulanger <renoir@w3.org>

# Dependencies: Bikeshed, PhantomJS, Bikshed’s lxml
RUN apt-get update && \
    apt-get install -yqq git python2.7 python-dev python-pip libxslt1-dev libxml2-dev zlib1g-dev && \
    apt-get install -yqq libfontconfig1 libfreetype6 curl && \
    apt-get autoremove -yqq --purge && \
    pip install --upgrade lxml

# Copy everything we have locally into the container
# REMINDER: Make sure you run `make clone-bikeshed`, we prefer to keep a copy locally outside
# of the data volume. Otherwise it would make problems saying that bikeshed clone is not in the
# same filesystem.
COPY . /srv/webplatform/specs/

# Make sure we have a "non root" user and
# delete any local workbench data/ directory
RUN /usr/sbin/useradd --system -G sudo --home-dir /srv/webplatform/specs --shell /bin/bash app-user && \
    sed -i '/^%sudo/d' /etc/sudoers && \
    echo '%sudo ALL=NOPASSWD: ALL' >> /etc/sudoers && \
    mv /srv/webplatform/specs/bikeshed /opt && \
    rm -rf data && \
    mkdir -p data/temp && \
    rm -rf Dockerfile Makefile .git .gitignore DOCKER.md && \
    chown -R app-user:www-data /srv/webplatform/specs && \
    chown -R app-user:app-user /opt/bikeshed

# Switch from root to app-user user
# It **HAS to be** the SAME uid/gid as the owner on the host from which we’ll use as volume
USER app-user

# Where the session will start from
WORKDIR /srv/webplatform/specs

# Environment variables
ENV PATH /srv/webplatform/specs/node_modules/.bin:/srv/webplatform/specs/bin:/srv/webplatform/specs/.local/bin:$PATH
ENV HOME /srv/webplatform/specs
ENV TMPDIR /srv/webplatform/specs/data/temp
ENV NODE_ENV production
ENV GIT_DISCOVERY_ACROSS_FILESYSTEM true

# Run what `make deps` would do
RUN pip install --upgrade --user --editable /opt/bikeshed && \
    mkdir -p node_modules && npm install

# Declare which port we expect to expose
EXPOSE 7002

# Allow cli entry for debug, but make sure docker-compose.yml uses "command: bin/run.sh"
ENTRYPOINT ["/bin/bash"]

# Note leftover: Ideally, it should exclusively run
#ENTRYPOINT ["/bin/bash", "/srv/webplatform/specs/bin/run.sh"]

# Note leftover: What it ends up doing
#CMD ["node_modules/forever/bin/forever", "--fifo", "logs", "0"]
