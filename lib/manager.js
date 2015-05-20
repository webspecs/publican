
var fs = require("fs")
,   pth = require("path")
,   jn = pth.join
,   dataDir = jn(__dirname, "../data")
,   log = require("./log")
,   lock = require("./lock")
,   util = require("util")
// tasks
,   processTheIndex = require("./tasks/process-the-index")
,   processStatic = require("./tasks/process-static")
,   processBikeshed = require("./tasks/init-bikeshed")
,   processSpec = require("./tasks/process-spec")
,   purge = require("./tasks/purge")
;

// loads the configuration itself
// provides contexts itself (needs to replace all calls to getContext and kill the module)
// is the entry point for runTask() when you don't already have a task, need to replace those too
function Manager (opt) {
    opt = opt || {};
    var configPath = opt.config || jn(dataDir, "config.json");
    if (!/^\//.test(configPath)) configPath = pth.resolve(process.cwd(), configPath);
    this.config = require(configPath);
    this.log = log.createLogger(this.config);
}
Manager.prototype = {
    // run this with extreme caution
    initSetup:  function initSetupHandler (cb) {
        this.log.info("Initialising setup");
        this.runTask(require("./tasks/init-all"), this.getContext(), function runTaskErrorHandler (err) {
            if (err) return this.log.error(err);
            this.log.info("OK!");
            if (cb) cb();
        }.bind(this));
    }

,   updateContextForRepo:   function updateContextForRepoHandler (ctx, opt) {
        if (opt.repository) {
            // git details
            ctx.gitRepoURL = "https://github.com/" + opt.repository + ".git";
            ctx.gitDir  = jn(dataDir, "gits", opt.repository);
            ctx.repository = opt.repository;
        }
        if (opt.branch) ctx.branch = opt.branch;
        if (opt.repository && opt.branch) {
            ctx.specSubDir = ctx.buildSpecDir(opt.repository, opt.branch);
            ctx.specDir = jn(ctx.publishDir, ctx.specSubDir);
        }
    }

,   getContext: function getContextHandler (opt) {
        opt = opt || {};
        var ctx = {
            // common facilities
                log:        this.log
            ,   lock:       lock.createLock(this)
            ,   rfs:        function readFileSyncHandler (file) { return fs.readFileSync(file, "utf8"); }
            ,   wfs:        function writeFileSyncHandler (file, content) { fs.writeFileSync(file, content, { encoding: "utf8" }); }
            ,   buildSpecDir:   function buildSpecDirHandler (repo, branch) {
                    var parts = repo.split("/", 2);
                    return [parts[1], parts[0], branch].join("/");
                }
            // common directories
            ,   dataDir:        dataDir
            ,   publishDir:     jn(dataDir, "publish")
            ,   theIndexPath:   jn(dataDir, "publish/index.html")
            // bikeshed details (conf has python)
            ,   bikeshed:       "bikeshed"
            }
        ;
        this.updateContextForRepo(ctx, opt);
        // copy configuration
        for (var k in this.config) ctx[k] = this.config[k];
        return ctx;
    }

,   runTask:    function runTaskHandler (tasks, ctx, cb) {
        if (!ctx) ctx = this.getContext();
        if (!util.isArray(tasks)) tasks = [tasks];
        tasks = tasks.concat();
        var done = function runTaskDoneHandler (err) {
                if (err) return cb(err);
                iterate();
            }
        ,   iterate = function runTaskIterateHandler() {
                if (!tasks.length) return cb();
                var task = tasks.shift();
                // console.log("####### tasks: " + tasks.length);
                // try { throw(new Error("STACK")); }
                // catch (e) { console.log(e.stack); }
                if (util.isArray(task)) this.runTask(task, ctx, done);
                else task.call(this, ctx, done);
            }.bind(this)
        ;
        iterate();
    }

    // this is the entry point for the manager, called by the server
    // it looks at repoDesc (which has a repository and branch) and based on that it will
    // pick a task to run, having prepared the correct context for it
,   runAppropriateTask: function funAppropriateTaskHandler (repoDesc, cb) { // replaces processRepository
        var repo = repoDesc.repository
        ,   ctx = this.getContext(repoDesc)
        ;

        // we have special repositories that have expected behaviour
        if (repo === "webspecs/the-index") {
            this.runTask(processTheIndex, ctx, cb);
        }
        else if (repo === "webspecs/assets" || repo === "webspecs/docs") {
            ctx.subDirOnly = (repo === "webspecs/assets") ? "assets" : "docs";
            ctx.specDir = jn(ctx.publishDir, ctx.subDirOnly);
            this.runTask(processStatic, ctx, cb);
        }
        else if (repo === "webspecs/bikeshed") {
            this.runTask(processBikeshed, ctx, cb);
        }
        // this is a normal spec
        else {
            ctx.subDirOnly = ctx.specSubDir;
            this.runTask(processSpec, ctx, cb);
            this.runTask(purge, ctx, cb);
        }
    }

};
module.exports = Manager;
