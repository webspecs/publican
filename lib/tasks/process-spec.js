
var Task = require("../task")
,   fs = require("fs")
,   jn = require("path").join
;

module.exports = new Task();
module.exports
            .add([
                // extract the index so we know the file name
                require("./extract-the-index")
            ,   function (ctx, cb) {
                    ctx.theIndexRepositories
                        .forEach(function (it) {
                            if (it.repository === ctx.repository && it.branch === ctx.branch) {
                                ctx.baseFileName = it.baseFileName;
                                return cb();
                            }
                        })
                    ;
                }
            ,   require("./git-clone-or-fetch")
            ,   require("./git-publish")
            // based on the path and file name, pick bs or rs
            ,   function (ctx, cb) {
                    var basePath = jn(ctx.specDir, ctx.baseFileName);
                    if (fs.existsSync(basePath + ".src.html"))
                        return module.exports.runTask(require("./generate-respec"), cb);
                    if (fs.existsSync(basePath + ".bs"))
                        return module.exports.runTask(require("./generate-bikeshed"), cb);
                    cb(new Error("Failed to find a specification file in " + ctx.specDir));
                }
            ,   require("./rsync")
            ,   require("./purge-all")
            ])
;    


