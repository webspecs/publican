
var jn = require("path").join
,   exec = require("child_process").exec
,   lock = require("./lock")
,   log = require("./log")
;

exports.bikeshed = function (python, bikeshed, directory, cb) {
    lock.lock(
        "bikeshed " + directory
    ,   function (release) {
            log.info(python + " " + bikeshed + " spec " + jn(directory, "index.bs") + " " + jn(directory, "index.html"));
            exec(python + " " + bikeshed + " -f spec " + jn(directory, "index.bs") + " " + jn(directory, "index.html"), { cwd: directory }, function (err, stdout, stderr) {
                if (err) {
                    log.error(stderr);
                    log.error(stdout);
                }
                release(err);
            });
        }
    ,   cb
    );

};
