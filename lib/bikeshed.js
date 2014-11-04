
var jn = require("path").join
,   exec = require("child_process").exec
;

exports.bikeshed = function (python, bikeshed, directory, cb) {
    // console.log(python + " " + bikeshed + " spec " + jn(directory, "index.bs") + " " + jn(directory, "index.html"));
    exec(python + " " + bikeshed + " spec " + jn(directory, "index.bs") + " " + jn(directory, "index.html"), { cwd: directory }, cb);
};
