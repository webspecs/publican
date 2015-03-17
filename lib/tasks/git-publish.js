
var fs = require("fs-extra")
,   exec = require("child_process").exec
,   tmp = require("tmp")
,   async = require("async")
,   jn = require("path").join
,   Task = require("../task")
;


// expects
//  branch: the branch to use
//  gitDir:     the directory in which the repo is stored
module.exports = new Task();
module.exports.add([
                    // make a temp directory
                    function (ctx, cb) {
                        tmp.dir({ mode: 0755 }, function (err, tmpDir) {
                            if (err) return cb(err);
                            ctx.tmpDir = tmpDir;
                            cb();
                        });
                    }
                    // extract the content
                ,   function (ctx, cb) {
                        var cmd = "git archive " + ctx.branch + " | tar -x -C " + ctx.tmpDir;
                        log.info("Publish: " + cmd + ", in " + ctx.gitDir);
                        exec(cmd, { cwd: ctx.gitDir }, cb);
                    }
                    // call out if cb
                    // move the dir
                    // do something horrible with copying
                ])
;

// when publishing the-index, the special function output is used to transform the index and store it
// at the destination
// that stupid feature should be removed
// this should handle publishing a complete repo
// publishing a file should be something else
// or simply publish to tmp *always* and let someone else handle the subsequent work — smarter

// or have it know when to copy a file or a dir
// keep the tmpDir around, always

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
