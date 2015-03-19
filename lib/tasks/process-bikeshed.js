
var fs = require("fs")
,   jn = require("path").join
,   processSpec = require("./process-spec")
;

module.exports = [
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
                        ,   ctx = this.getContext(it)
                        ;
                        ctx.subDirOnly = ctx.specSubDir;
                        this.runTask(processSpec, ctx, function (err) {
                            if (err) ctx.log.error(err);
                            iterate();
                        });
                    }.bind(this);
                    iterate();
                }
            ]
;
