
var fs = require("fs-extra")
,   jn = require("path").join
,   processStatic = require("./process-static")
,   processBikeshed = require("./process-bikeshed")
,   processTheIndex = require("./process-the-index")
;

function makeStaticTask (which) {
    return function (ctx, cb) {
            ctx = this.getContext({ repository: "webspecs/" + which, branch: "master" });
            ctx.subDirOnly = which;
            ctx.specDir = jn(ctx.publishDir, ctx.subDirOnly);
            this.runTask(processStatic, ctx, cb);
    };
}

module.exports = [
                function (ctx, cb) {
                    "gits publish bikeshed queue logs"
                        .split(" ")
                        .forEach(function (dir) {
                            dir = jn(ctx.dataDir, dir);
                            ctx.log.info("Ensuring the existence of " + dir);
                            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                        })
                    ;
                    cb();
                }
            ,   makeStaticTask("assets")
            ,   makeStaticTask("docs")
            ,   function (ctx, cb) {
                    ctx.specDir = jn(ctx.dataDir, "bikeshed");
                    ctx.theIndexRepositories = [];
                    this.runTask(processBikeshed, ctx, cb);
                }
            ,   processTheIndex
            ]
;
