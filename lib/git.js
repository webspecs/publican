
var fs = require("fs-extra")
,   exec = require("child_process").exec
,   mkdirp = require("mkdirp")
,   async = require("async")
,   jn = require("path").join
,   lock = require("./lock")
,   log = require("./log")
;

exports.cloneOrFetch = function (repo, dir, cb) {
    lock.lock(
        "cloneOrFetch " + repo
    ,   function (release) {
            if (fs.existsSync(dir)) {
                log.info("git fetch in " + dir);
                exec("git fetch", { cwd: dir }, release);
            }
            else {
                log.info("git clone --mirror " + repo + " " + dir);
                mkdirp.sync(dir);
                exec("git clone --mirror " + repo + " " + dir, release);
            }
        }
    ,   cb
    );
};

exports.publish = function (gitDir, branch, outDir, cb) {
    lock.lock(
        "publish " + outDir
    ,   function (release) {
            var cmd = "git archive " + branch + " | tar -x -C " + outDir;
            log.info("Publish: " + cmd + ", in " + gitDir);
            async.series(
                [
                    function (cb) { mkdirp(outDir, cb); }
                ,   function (cb) { exec(cmd, { cwd: gitDir }, cb); }
                ,   function (cb) { fs.copy(gitDir.replace(/\/$/, ""), jn(outDir, ".git"), cb); }
                ]
            ,   release
            );
        }
    ,   cb
    );
};
