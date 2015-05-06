
var exec = require("child_process").exec;

// expects:
//  gitDir:     the directory in which the repo is stored
module.exports = function gitFetch (ctx, cb) {
    ctx.lock(
        "fetch " + ctx.gitDir
    ,   function gitFetchHandler (release) {
            ctx.log.info("git fetch in " + ctx.gitDir);
            exec("git fetch", { cwd: ctx.gitDir }, release);
        }
    ,   cb
    );
};
