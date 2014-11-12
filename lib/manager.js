
var fs = require("fs")
,   jn = require("path").join
,   async = require("async")
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

// So-called "canonical" format is the one used in specifying specialRepositories above. The
// "pairs" format has one list item per repo+branch pair and has gitDir, repo, and publishDir keys
exports.canonical2pairs = function (inList) {
    var outList = [];
    for (var i = 0, n = inList.length; i < n; i++) {
        var repo = inList[i];
        for (var k in repo.branches) {
            outList.push({
                gitDir:     jn(dataDir, "gits", repo.repository)
            ,   repository: k
            ,   publishDir: jn(dataDir, "publish", repo.branches[k])
            });
        }
    }
    return outList;
};

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
    async.each(
        repos
    ,   function (repo, cb) {
            log.info("Getting: " + repo.repository + " into " + jn(dataDir, "gits", repo.repository));
            git.cloneOrFetch(conf.repoTmpl.replace("{repo}", repo.repository), jn(dataDir, "gits", repo.repository), cb);
        }
    ,   cb
    );
};

exports.publishRepositories = function (repos, conf, cb) {
    log.info("Publishing " + repos.length + " repositories");
    async.each(
        exports.canonical2pairs(repos)
    ,   function (target, cb) {
            log.info("Publishing: " + target.gitDir + ", branch " + target.repository + " into " + target.publishDir);
            git.publish(target.gitDir, target.repository, target.publishDir, cb);
        }
    ,   cb
    );
};

exports.bikeshedRepositories = function (repos, conf, cb) {
    log.info("Bikeshedding " + repos.length + " repositories");
    async.each(
        exports.canonical2pairs(repos)
    ,   function (target, cb) {
            log.info("Bikeshedding " + target);
            bs.bikeshed(conf.python, jn(dataDir, "bikeshed/bikeshed.py"), target.publishDir, cb);
        }
    ,   cb
    );
};

// run this with extreme caution
exports.initSetup = function () {
    log.log("Initialising setup");
    var conf = cnf.readConfiguration()
    ,   commonRepositories
    ;
    exports.ensureDirs();
    
    async.series(
        [
            function (cb) {
                exports.getRepositories(specialRepositories, conf, cb);
            }
        ,   function (cb) {
                log.info("Got special repositories");
                exports.publishRepositories(specialRepositories, conf, cb);
            }
        ,   function (cb) {
                log.info("Published special repositories");
                commonRepositories = exports.commonRepositories();
                exports.getRepositories(commonRepositories, conf, cb);
            }
        ,   function (cb) {
                exports.saveWanted();
                log.info("Got common repositories");
                exports.publishRepositories(commonRepositories, conf, cb);
            }
        ,   function (cb) {
                log.info("Published common repositories");
                exports.bikeshedRepositories(commonRepositories, conf, cb);
            }
        ,   function (cb) {
                log.info("Bikeshedding done");
                rsync.rsync({
                        from:   jn(dataDir, "publish/")
                    ,   to:     conf.rsyncRemote + ":" + conf.rsyncPath
                    ,   delete: true
                    }
                ,   cb
                );
            }
        ]
    ,   function (err) {
            if (err) return log.error(err);
            log.info("OK!");
        }
    );
};
