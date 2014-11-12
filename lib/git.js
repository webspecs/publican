
var fs = require("fs-extra")
,   exec = require("child_process").exec
,   mkdirp = require("mkdirp")
,   jn = require("path").join
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
    var cmd = "git archive " + branch + " | tar -x -C " + outDir;
    log.info("Publish: " + cmd + ", in " + gitDir);
    mkdirp.sync(outDir);
    exec(cmd, { cwd: gitDir }, function (err) {
        if (err) return log.error(err);
        fs.copy(gitDir.replace(/\/$/, ""), jn(outDir, ".git"), function (err) {
            if (err) return log.error(err);
            cb();
        });
    });
};
