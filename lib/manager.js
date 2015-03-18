
var fs = require("fs")
,   jn = require("path").join
,   async = require("async")
,   dataDir = jn(__dirname, "../data")
,   ie = require("./the-index")
,   git = require("./git")
,   context = require("./context")
,   rsync = require("./rsync")
,   conf = require(jn(dataDir, "config.json"))
,   log = require("./log")
// tasks
,   Task = require("./tasks")
,   processTheIndex = require("./tasks/process-the-index")
,   processStatic = require("./tasks/process-static")
,   processBikeshed = require("./tasks/process-bikeshed")
,   processSpec = require("./tasks/process-spec")
;

// run this with extreme caution
exports.initSetup = function (cb) {
    log.log("Initialising setup");

    var task = new Task(context.getContext());
    task.runTask(require("./tasks/init-all"), function (err) {
        if (err) return log.error(err);
        log.info("OK!");
        if (cb) cb();
    });
};

exports.processRepository = function (data, cb) {
    var currentCommon
    ,   wantedFile = jn(dataDir, "wanted.json")
    ,   wanted = JSON.parse(fs.readFileSync(wantedFile, "utf8"))
    ,   repo = data.repository
    ,   branch = data.branch
    ,   regen = wanted[repo].regen
    ,   publishDir = jn(dataDir, "publish", wanted[repo].branches[branch])
    ,   gitDir = jn(dataDir, "gits", repo)
    ;
    log.info("Hook regen mode: " + (regen || "default"));
    if (regen === "extracted") currentCommon = exports.commonRepositories();
    async.series(
        [
            function (cb) { git.cloneOrFetch(conf.repoTmpl.replace("{repo}", repo), gitDir, cb); }
        ,   function (cb) {
                if (repo === "webspecs/the-index") {
                    log.info("Special processing for the-index");
                    git.publish(
                        gitDir
                    ,   branch
                    ,   function (tmpDir, cb) {
                            log.info("Transforming the-index");
                            ie.transform(jn(tmpDir, "index.html"), jn(publishDir, "index.html"));
                            cb();
                        }
                    ,   cb
                    );
                }
                else {
                    git.publish(gitDir, branch, publishDir, cb);
                }
            }
        ,   function (cb) {
                if (regen === "extracted") {
                    var newCommon = exports.commonRepositories()
                    ,   oldCache = []
                    ,   newCache = []
                    ,   cacheMap = {}
                    ,   repoCache = function (arr) {
                            return function (repo) {
                                for (var k in repo.branches) {
                                    var str = repo.repository + "#" + k;
                                    arr.push(str);
                                    cacheMap[str] = repo.branches[k];
                                }
                            };
                        }
                    ;
                    currentCommon.forEach(repoCache(oldCache));
                    newCommon.forEach(repoCache(newCache));
                    var deletedRepos = oldCache.filter(function (it) { return newCache.indexOf(it) === -1; })
                    ,   newRepos = newCache.filter(function (it) { return oldCache.indexOf(it) === -1; })
                    ,   delFile = jn(dataDir, "deleted.json")
                    ;
                    if (deletedRepos.length) {
                        var delList = [];
                        if (fs.existsSync(delFile)) delList = JSON.parse(fs.readFileSync(delFile, "utf8"));
                        fs.writeFileSync(delFile, JSON.stringify(delList.concat(deletedRepos), null, 4), { encoding: "utf8" });
                        deletedRepos.forEach(function (it) {
                            var parts = it.split("#", 2)
                            ,   repo = parts[0]
                            ,   branch = parts[1]
                            ;
                            if (wanted[repo] && wanted[repo].branches[branch]) {
                                delete wanted[repo].branches[branch];
                                if (!Object.keys(wanted[repo].branches).length) delete wanted[repo];
                            }
                        });
                        fs.writeFileSync(wantedFile, JSON.stringify(wanted, null, 4), { encoding: "utf8" });
                    }
                    if (newRepos.length) {
                        var reposAsWanted = [];
                        newRepos.forEach(function (it) {
                            var parts = it.split("#", 2)
                            ,   repo = parts[0]
                            ,   branch = parts[1]
                            ,   obj = {
                                    repository: repo
                                ,   branches:   {}
                                }
                            ;
                            obj.branches[branch] = cacheMap[it];
                            reposAsWanted.push(obj);
                            if (!wanted[repo]) wanted[repo] = { branches: {} };
                            wanted[repo].branches[branch] = cacheMap[it];
                        });
                        fs.writeFileSync(wantedFile, JSON.stringify(wanted, null, 4), { encoding: "utf8" });
                        exports.generateRepositories(reposAsWanted, conf, cb);
                    }
                    else cb();
                }
                else {
                    exports.transformRepository(conf, jn(dataDir, "publish", wanted[repo].branches[branch]), wanted[repo].fileName || "index", repo, cb);
                }
            }
        ,   function (cb) { rsync.rsync({ from: jn(dataDir, "publish/"), to: conf.rsyncRemote + ":" + conf.rsyncPath, delete: true }, cb); }
        ]
    ,   cb
    );
};

// this is the entry point for the manager, called by the server
// it looks at repoDesc (which has a repository and branch) and based on that it will
// pick a task to run, having prepared the correct context for it
exports.runAppropriateTask = function (repoDesc, cb) { // replaces processRepository
    var repo = repoDesc.repository
    ,   ctx = context.getContext(repoDesc)
    ;
    var task = new Task(ctx);

    // we have special repositories that have expected behaviour
    if (repo === "webspecs/the-index") {
        task.runTask(processTheIndex, cb);
        // XXX
        // run process-the-index (output to data/publish/index.html)
        // note that this must:
        //  delete repos that are no longer valid (keeping track of the old ones)
        //  process new repos if needed
        //  do nothing if the change does not affect the list of repos
    }
    else if (repo === "webspecs/assets" || repo === "webspecs/docs") {
        ctx.subDirOnly = (repo === "webspecs/assets") ? "assets" : "docs";
        ctx.specDir = jn(ctx.publishDir, ctx.subDirOnly);
        task.runTask(processStatic, cb);
    }
    else if (repo === "webspecs/bikeshed") {
        ctx.specDir = jn(dataDir, "bikeshed");
        task.runTask(processBikeshed, cb);
    }
    // this is a normal spec
    else {
        ctx.subDirOnly = ctx.specSubDir;
        task.runTask(processSpec, cb);
    }
};
