
var processSpec = require("./process-spec");

module.exports = [
                require("./extract-the-index") // first time, get the old values
            ,   function (ctx, cb) {
                    ctx.oldIndexRepositories = ctx.theIndexRepositories;
                    ctx.theIndexRepositories = null;
                    this.updateContextForRepo(ctx, { repository: "webspecs/the-index", branch: "master" });
                    cb();
                }
            ,   require("./git-clone-or-fetch")
            ,   function (ctx, cb) {
                    ctx.copyFile = "index.html";
                    cb();
                }
            ,   require("./git-publish")
            ,   require("./generate-the-index")
            ,   require("./extract-the-index") // get the updated list
            ,   function (ctx, cb) {
                    var newRepos = [];
                    ctx.theIndexRepositories
                        .forEach(function (it) {
                            var isOld = ctx.oldIndexRepositories.some(function (old) {
                                return old.repository === it.repository &&
                                        old.branch === it.branch &&
                                        old.baseFileName === it.baseFileName;
                            });
                            if (isOld) return;
                            newRepos.push(it);
                        })
                    ;
                    var iterate = function () {
                        if (!newRepos.length) {
                            ctx.subDirOnly = "index.html";
                            return cb();
                        }
                        var it = newRepos.shift();
                        this.updateContextForRepo(ctx, it);
                        ctx.subDirOnly = ctx.specSubDir;
                        this.runTask(processSpec, ctx, function (err) {
                            if (err) ctx.log.error(err);
                            iterate();
                        });
                    }.bind(this);
                    iterate();
                }
            ,   require("./rsync")
            ,   require("./purge-all")
            ]
;    
