
var fs = require("fs")
,   exec = require("child_process").exec
,   mkdirp = require("mkdirp")
,   rimraf = require("rimraf")
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
    var cmd = "git clone -b " + branch + " " + gitDir + " " + outDir;
    // log.info("Publish: git archive " + branch + " | tar -x -C " + outDir + ", in " + gitDir);
    log.info("Publish: " + cmd);
    rimraf(outDir, function (err) {
        if (err) return log.error(err);
        exec(cmd, cb);
    });
    // mkdirp.sync(outDir);
    // exec("git archive " + branch + " | tar -x -C " + outDir, { cwd: gitDir }, cb);
};
