
var jn = require("path").join;

module.exports = [
                function (ctx, cb) {
                    this.updateContextForRepo(ctx, { repository: "webspecs/bikeshed", branch: "webspecs" });
                    ctx.specDir = jn(ctx.dataDir, "bikeshed");
                    cb();
                }
            ,   require("./git-clone-or-fetch")
            ,   require("./git-publish")
            ]
;
