
var jn = require("path").join
,   exec = require("child_process").exec
;

// expects
//  python: the path to python
//  bikeshed: the path to bikeshed
//  specDir: the path to the directory in which the spec lives
//  baseFileName: the base file name, without extension, to use (defaults to index)
module.exports = function (ctx, cb) {
    var fn = ctx.baseFileName;
    if (fn.indexOf("/") === 0 || fn.indexOf("..") > -1) return cb("Invalid file name: " + fn);
    ctx.lock(
        "bikeshed " + ctx.specDir
    ,   function (release) {
            var cmd = ctx.python + " " +
                      ctx.bikeshed + " -f spec " +
                      jn(ctx.specDir, fn + ".bs") + " " +
                      jn(ctx.specDir, "index.html")
            ;
            ctx.log.info(cmd);
            exec(cmd, { cwd: ctx.specDir }, function (err, stdout, stderr) {
                if (err) {
                    ctx.log.error(stderr);
                    ctx.log.error(stdout);
                }
                release(err);
            });
        }
    ,   cb
    );
};
