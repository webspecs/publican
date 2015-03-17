
var fs = require("fs-extra")
,   exec = require("child_process").exec
,   tmp = require("tmp")
,   async = require("async")
,   jn = require("path").join
,   lock = require("./lock")
,   log = require("./log")
;

// removed cloneOrFetch = function (repo, dir, cb)

// if outDir is a function, it takes over the copying work
exports.publish = function (gitDir, branch, outDir, cb) {
    var isOutFunc = typeof outDir === "function";
    lock.lock(
        "publish " + gitDir
    ,   function (release) {
            tmp.dir({ mode: 0755 }, function (err, tmpDir) {
                var cmd = "git archive " + branch + " | tar -x -C " + tmpDir;
                log.info("Publish: " + cmd + ", in " + gitDir);
                async.series(
                    [
                        function (cb) { exec(cmd, { cwd: gitDir }, cb); }
                    ,   function (cb) {
                            if (isOutFunc) outDir(tmpDir, cb);
                            else {
                                // fs.move does not overwrite directories with content, even with clobber
                                fs.remove(outDir, function (err) {
                                    if (err) cb(err);
                                    fs.move(tmpDir, outDir, { clobber: true }, cb);
                                });
                            }
                        }
                    ,   function (cb) {
                            if (isOutFunc) cb();
                            else fs.copy(gitDir.replace(/\/$/, ""), jn(outDir, ".git"), cb);
                        }
                    ]
                ,   release
                );
            });
        }
    ,   cb
    );
};
