
var fs = require("fs")
,   exec = require("child_process").exec
,   mkdirp = require("mkdirp")
,   log = require("./log")
;

exports.cloneOrFetch = function (repo, dir, cb) {
    if (fs.existsSync(dir)) {
        log.info("git fetch in " + dir);
        exec("git fetch", { cwd: dir }, cb);
    }
    else {
        log.info("git clone --mirror " + repo + " " + dir);
        mkdirp.sync(dir);
        exec("git clone --mirror " + repo + " " + dir, cb);
    }
};

exports.publish = function (gitDir, branch, outDir, cb) {
    log.info("Publish: git archive " + branch + " | tar -x -C " + outDir + ", in " + gitDir);
    mkdirp.sync(outDir);
    exec("git archive " + branch + " | tar -x -C " + outDir, { cwd: gitDir }, cb);
};
