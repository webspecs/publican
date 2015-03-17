
var fs = require("fs-extra")
,   exec = require("child_process").exec
;

// expects:
//  gitDir:     the directory in which the repo is stored
//  gitRepoURL: the repository
module.exports = function (ctx, cb) {
    ctx.lock(
        "clone " + ctx.gitRepoURL
    ,   function (release) {
            fs.mkdirp(ctx.gitDir, function (err) {
                if (err) return release(err);
                exec("git clone --mirror " + ctx.gitRepoURL + " " + ctx.gitDir, release);
            });
        }
    ,   cb
    );
};
