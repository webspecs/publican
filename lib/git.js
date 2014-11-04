
var fs = require("fs")
,   exec = require("child_process").exec
,   mkdirp = require("mkdirp")
;

exports.cloneOrFetch = function (repo, dir, cb) {
    if (fs.existsSync(dir)) {
        exec("git fetch", { cwd: dir }, cb);
    }
    else {
        mkdirp.sync(dir);
        exec("git clone --bare " + repo + " " + dir, cb);
    }
};

exports.publish = function (gitDir, branch, outDir, cb) {
    exec("git archive " + branch + " | tar -x -C " + outDir, { cwd: gitDir }, cb);
};
