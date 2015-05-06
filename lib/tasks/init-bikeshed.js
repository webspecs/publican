
var jn = require("path").join;

module.exports = [
                function initBikeshed (ctx, cb) {
                    this.updateContextForRepo(ctx, { repository: "webspecs/bikeshed", branch: "webspecs" });
                    ctx.specDir = "bikeshed";
                    cb();
                }
            ,   require("./git-clone-or-fetch")
            ,   require("./git-publish")
            ]
;
