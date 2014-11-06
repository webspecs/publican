
var jn = require("path").join
,   exec = require("child_process").exec
,   log = require("./log")
;

exports.bikeshed = function (python, bikeshed, directory, cb) {
    log.info(python + " " + bikeshed + " spec " + jn(directory, "index.bs") + " " + jn(directory, "index.html"));
    exec(python + " " + bikeshed + " -f spec " + jn(directory, "index.bs") + " " + jn(directory, "index.html"), { cwd: directory }, function (err, stdout, stderr) {
        if (err) {
            log.error(err);
            log.error(stderr);
            log.error(stdout);
            cb(err);
        }
        cb();
    });
};
