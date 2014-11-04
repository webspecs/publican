
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   ie = require("./index-extractor")
,   git = require("./git")
,   bs = require("./bikeshed")
,   rsync = require("./rsync")
,   specialRepositories = [
        {
            repository: "webspecs/the-index"
        ,   branches:   {
                master: "/"
            }
        ,   noDelete:   true
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
        }
    ]
;

exports.ensureDirs = function () {
    "gits publish bikeshed"
        .split(" ")
        .forEach(function (dir) {
            dir = jn(dataDir, dir);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        })
    ;
};

exports.commonRepositories = function () {
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

// XXX add caching
exports.listRepositories = function () {
    return [].concat(specialRepositories).concat(exports.commonRepositories());
};

exports.readConfiguration = function () {
    return JSON.parse(fs.readFileSync(jn(dataDir, "config.json"), "utf8"));
};

exports.getRepositories = function (repos, conf, cb) {
    repos = [].concat(repos);
    function doRepo () {
        if (repos.length === 0) return cb();
        var repo = repos.shift();
        git.cloneOrFetch(conf.repoTmpl.replace("{repo}", repo.repository), jn(dataDir, "gits", repo.repository), function (err) {
            if (err) return cb(err);
            doRepo();
        });
    }
    doRepo();
};

exports.publishRepositories = function (repos, conf, cb) {
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
        git.publish(target[0], target[1], target[2], function (err) {
            if (err) return cb(err);
            doTarget();
        });
    }
    doTarget();
};

exports.bikeshedRepositories = function (repos, conf, cb) {
    var targets = [];
    for (var i = 0, n = repos.length; i < n; i++) {
        var repo = repos[i];
        for (var k in repo.branches) targets.push(jn(dataDir, "publish", repo.branches[k]));
    }
    function doTarget () {
        if (targets.length === 0) return cb();
        var target = targets.shift();
        bs.bikeshed(conf.python, jn(dataDir, "bikeshed/bikeshed.py"), target, function (err) {
            if (err) return cb(err);
            doTarget();
        });
    }
    doTarget();
};

// run this with extreme caution
exports.initSetup = function () {
    var conf = exports.readConfiguration()
    ,   debug = conf.debug
    ;
    if (debug) console.log("Configuration loaded");
    exports.ensureDirs();
    if (debug) console.log("Directories ascertained");
    // promises, promises, where art thou?
    exports.getRepositories(specialRepositories, conf, function (err) {
        if (err) return console.error("[ERROR]", err);
        if (debug) console.log("Got special repositories");
        exports.publishRepositories(specialRepositories, conf, function (err) {
            if (err) return console.error("[ERROR]", err);
            if (debug) console.log("Published special repositories");
            var commonRepositories = exports.commonRepositories();
            exports.getRepositories(commonRepositories, conf, function (err) {
                if (err) return console.error("[ERROR]", err);
                if (debug) console.log("Got common repositories");
                exports.publishRepositories(commonRepositories, conf, function (err) {
                    if (err) return console.error("[ERROR]", err);
                    if (debug) console.log("Published common repositories");
                    exports.bikeshedRepositories(commonRepositories, conf, function (err) {
                        if (err) return console.error("[ERROR]", err);
                        if (debug) console.log("Bikeshedding done");
                        rsync.rsync({
                                from:   jn(dataDir, "publish/")
                            ,   to:     conf.rsyncRemote + ":" + conf.rsyncPath
                            ,   delete: true
                            }
                        ,   function (err) {
                                if (err) return console.error("[ERROR]", err);
                                console.log("OK!");
                            }
                        );
                    });
                });
            });
        });
    });
};
