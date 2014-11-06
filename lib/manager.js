
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   ie = require("./index-extractor")
,   git = require("./git")
,   bs = require("./bikeshed")
,   rsync = require("./rsync")
,   cnf = require("../lib/config")
,   log = require("./log")
,   specialRepositories = [
        {
            repository: "webspecs/the-index"
        ,   branches:   {
                master: "/"
            }
        ,   noDelete:   true
        ,   regen:      "extracted"
        }
    ,   {
            repository: "webspecs/assets"
        ,   branches:   {
                master: "/assets/"
            }
        }
    ,   {
            repository: "webspecs/documentation"
        ,   branches:   {
                master: "/project/"
            }
        }
    ,   {
            repository: "webspecs/bikeshed"
        ,   branches:   {
                webspecs:   "../bikeshed/"
            }
        ,   regen:      "all"
        }
    ]
;

// XXX
//  - add caching where possible
//  - make this more robust, failing to update one repo should not block the rest
//  - server
//  - consistent logging throughout

exports.ensureDirs = function () {
    "gits publish bikeshed"
        .split(" ")
        .forEach(function (dir) {
            dir = jn(dataDir, dir);
            log.info("Ensuring the existence of " + dir);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        })
    ;
};

exports.saveWanted = function () {
    var wanted = {};
    exports.listRepositories()
        .forEach(function (repo) {
            wanted[repo.repository] = {
                branches:   repo.branches
            ,   delete:     !repo.noDelete
            };
            if (repo.regen) wanted[repo.repository].regen = repo.regen;
        })
    ;
    log.info("Saving wanted.json");
    fs.writeFileSync(jn(dataDir, "wanted.json"), JSON.stringify(wanted, null, 4), { encoding: "utf8" });
};

exports.commonRepositories = function () {
    log.info("Extracting common repository information");
    var repos = {}, res = [];
    ie.extract(jn(dataDir, "publish/index.html"))
        .forEach(function (it) {
            if (!repos[it.repository]) repos[it.repository] = [];
            repos[it.repository].push(it.branch);
        })
    ;
    for (var k in repos) {
        var obj = { repository: k, branches: {} };
        repos[k].forEach(function (branch) {
            var path = k.split("/", 2);
            obj.branches[branch] = "/" + path[1] + "/" + path[0] + "/" + branch + "/";
        });
        res.push(obj);
    }
    return res;
};

exports.listRepositories = function () {
    return [].concat(specialRepositories).concat(exports.commonRepositories());
};

exports.getRepositories = function (repos, conf, cb) {
    log.info("Cloning/fetching " + repos.length + " repositories");
    repos = [].concat(repos);
    function doRepo () {
        if (repos.length === 0) return cb();
        var repo = repos.shift();
        log.info("Getting: " + repo.repository + " into " + jn(dataDir, "gits", repo.repository));
        git.cloneOrFetch(conf.repoTmpl.replace("{repo}", repo.repository), jn(dataDir, "gits", repo.repository), function (err) {
            if (err) return cb(err);
            doRepo();
        });
    }
    doRepo();
};

exports.publishRepositories = function (repos, conf, cb) {
    log.info("Publishing " + repos.length + " repositories");
    var targets = [];
    for (var i = 0, n = repos.length; i < n; i++) {
        var repo = repos[i];
        for (var k in repo.branches) {
            targets.push([
                jn(dataDir, "gits", repo.repository)
            ,   k
            ,   jn(dataDir, "publish", repo.branches[k])
            ]);
        }
    }
    function doTarget () {
        if (targets.length === 0) return cb();
        var target = targets.shift();
        log.info("Publishing: " + target[0] + ", branch " + target[1] + " into " + target[2]);
        git.publish(target[0], target[1], target[2], function (err) {
            if (err) return cb(err);
            doTarget();
        });
    }
    doTarget();
};

exports.bikeshedRepositories = function (repos, conf, cb) {
    log.info("Bikeshedding " + repos.length + " repositories");
    var targets = [];
    for (var i = 0, n = repos.length; i < n; i++) {
        var repo = repos[i];
        for (var k in repo.branches) targets.push(jn(dataDir, "publish", repo.branches[k]));
    }
    function doTarget () {
        if (targets.length === 0) return cb();
        var target = targets.shift();
        log.info("Bikeshedding " + target);
        bs.bikeshed(conf.python, jn(dataDir, "bikeshed/bikeshed.py"), target, function (err) {
            if (err) return cb(err);
            doTarget();
        });
    }
    doTarget();
};

// run this with extreme caution
exports.initSetup = function () {
    log.log("Initialising setup");
    var conf = cnf.readConfiguration()
    ;
    exports.ensureDirs();
    // promises, promises, where art thou?
    exports.getRepositories(specialRepositories, conf, function (err) {
        if (err) return log.error(err);
        log.info("Got special repositories");
        exports.publishRepositories(specialRepositories, conf, function (err) {
            if (err) return log.error(err);
            log.info("Published special repositories");
            var commonRepositories = exports.commonRepositories();
            exports.getRepositories(commonRepositories, conf, function (err) {
                if (err) return log.error(err);
                exports.saveWanted();
                log.info("Got common repositories");
                exports.publishRepositories(commonRepositories, conf, function (err) {
                    if (err) return log.error(err);
                    log.info("Published common repositories");
                    exports.bikeshedRepositories(commonRepositories, conf, function (err) {
                        if (err) return log.error(err);
                        log.info("Bikeshedding done");
                        rsync.rsync({
                                from:   jn(dataDir, "publish/")
                            ,   to:     conf.rsyncRemote + ":" + conf.rsyncPath
                            ,   delete: true
                            }
                        ,   function (err) {
                                if (err) return log.error(err);
                                log.info("OK!");
                            }
                        );
                    });
                });
            });
        });
    });
};
