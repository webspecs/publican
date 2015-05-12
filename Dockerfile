#
# Publican Docker runner
#
# See also:
#   * https://github.com/nodesource/docker-node/blob/master/ubuntu/trusty/node/0.10.36/Dockerfile

FROM nodesource/trusty:0.10.36

MAINTAINER Renoir Boulanger <renoir@w3.org>

ENV DEBIAN_FRONTEND=noninteractive

# Dependencies: Bikeshed, PhantomJS, Bikshed’s lxml
RUN apt-get update && apt-get -y upgrade && \
    apt-get install -yqq git python2.7 python-dev python-pip libxslt1-dev libxml2-dev zlib1g-dev && \
    apt-get install -yqq libfontconfig1 libfreetype6 curl && \
    apt-get autoremove -yqq --purge && \
    pip install --upgrade lxml

# Copy everything we have locally into the container
# REMINDER: Make sure you run `make clone-bikeshed`, we prefer to keep a copy locally outside
# of the data volume. Otherwise it would make problems saying that bikeshed clone is not in the
# same filesystem.
COPY . /srv/webapps/publican/

# Make sure we have a "non root" user and
# delete any local workbench data/ directory
RUN /usr/sbin/groupadd --system --gid 990 webapps && \
    /usr/sbin/useradd --system --gid 990 --uid 990 -G sudo --home-dir /srv/webapps --shell /bin/bash webapps && \
    sed -i '/^%sudo/d' /etc/sudoers && \
    echo '%sudo ALL=NOPASSWD: ALL' >> /etc/sudoers && \
    mv /srv/webapps/publican/bikeshed /opt && \
    rm -rf data && \
    mkdir -p data/temp && \
    rm -rf Dockerfile Makefile .git .gitignore DOCKER.md && \
    chown -R webapps:webapps /srv/webapps/publican && \
    chown -R webapps:webapps /opt/bikeshed

# Switch from root to webapps system user
# It **HAS to be** the SAME uid/gid as the owner on the host from which we’ll use as volume
USER webapps

# Where the session will start from
WORKDIR /srv/webapps/publican

# Environment variables
ENV PATH /srv/webapps/publican/node_modules/.bin:/srv/webapps/publican/bin:/srv/webapps/publican/.local/bin:$PATH
ENV HOME /srv/webapps/publican
ENV TMPDIR /srv/webapps/publican/data/temp
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
#ENTRYPOINT ["/bin/bash", "/srv/webapps/publican/bin/run.sh"]

# Note leftover: What it ends up doing
#CMD ["node_modules/forever/bin/forever", "--fifo", "logs", "0"]
