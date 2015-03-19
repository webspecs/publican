
module.exports = [
                function (ctx, cb) {
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
            ,   function (ctx, cb) {
                    ctx.subDirOnly = "index.html";
                    cb();
                }
            ,   require("./rsync")
            ,   require("./purge-all")
            ]
;    
