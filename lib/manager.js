
var jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   context = require("./context")
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
