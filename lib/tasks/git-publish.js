
var fs = require("fs-extra")
,   exec = require("child_process").exec
,   tmp = require("tmp")
,   jn = require("path").join
;

// expects
//  branch: the branch to use
//  gitDir: the directory in which the repo is stored
//  specDir: the path to the directory in which the spec lives
//  copyFile: if defined, the file name to copy over instead of the whole directory
module.exports = [
                    // make a temp directory
                    function gitPublish (ctx, cb) {
                        tmp.dir({ mode: 0755 }, function (err, tmpDir) {
                            if (err) return cb(err);
                            ctx.tmpDir = tmpDir;
                            cb();
                        });
                    }
                    // extract the content
                ,   function gitPublishArchiveHandler (ctx, cb) {
                        var cmd = "git archive " + ctx.branch + " | tar -x -C " + ctx.tmpDir;
                        ctx.log.info("Publish: " + cmd + ", in " + ctx.gitDir);
                        exec(cmd, { cwd: ctx.gitDir }, cb);
                    }
                    // move over the content
                ,   function gitPublishArchiveMover (ctx, cb) {
                        ctx.lock(
                            "move over content to " + ctx.specDir
                        ,   function gitPublishFileLockHandler (release) {
                                var tmp = ctx.tmpDir;
                                delete ctx.tmpDir;
                                if (ctx.copyFile) {
                                    fs.move(jn(tmp, ctx.copyFile), jn(ctx.specDir, ctx.copyFile), { clobber: true }, release);
                                }
                                else {
                                    fs.move(tmp, ctx.specDir, { clobber: true }, release);
                                }
                            }
                        ,   cb
                        );

                    }
                ]
;
// NOTE:
//  the old code here used to copy over the bare git repo to a .git, not sure why
//  it also supported a callback that was used for the-index. This should now just specify copyFile
//  and then transform that
