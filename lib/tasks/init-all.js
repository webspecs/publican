
var fs = require("fs-extra")
,   jn = require("path").join
,   processStatic = require("./process-static")
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
            ,   require("./init-bikeshed")
            ,   require("./init-the-index")
            ,   require("./extract-the-index")
            ,   function (ctx, cb) {
                    ctx.specsToProcess = ctx.theIndexRepositories;
                    cb();
                }
            ,   require("./process-specs")
            ]
;
