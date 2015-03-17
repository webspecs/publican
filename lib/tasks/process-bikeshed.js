
var Task = require("../task")
,   fs = require("fs")
,   jn = require("path").join
,   context = require("context")
,   processSpec = require("./process-spec")
;

module.exports = new Task();
module.exports
            .add([
                require("./git-clone-or-fetch")
            ,   require("./git-publish")
            ,   require("./extract-the-index")
            ,   function (ctx, cb) {
                    var bs = [];
                    ctx.theIndexRepositories
                        .forEach(function (it) {
                            var specDir = ctx.buildSpecDir(it.repository, it.branch);
                            if (fs.existsSync(jn(ctx.publishDir, specDir, it.baseFileName) + ".bs")) {
                                bs.push({
                                    specDir:        specDir
                                ,   baseFileName:   it.baseFileName
                                ,   repository:     it.repository
                                ,   branch:         it.branch
                                });
                            }
                        })
                    ;
                    var iterate = function () {
                        if (!bs.length) return cb();
                        var it = bs.shift()
                        ,   ctx = context.getContext(it)
                        ,   task = new Task(ctx)
                        ;
                        ctx.subDirOnly = ctx.specSubDir;
                        task.runTask(processSpec, function (err) {
                            if (err) ctx.log.error(err);
                            iterate();
                        });
                    };
                    iterate();
                }
            ])
;    
