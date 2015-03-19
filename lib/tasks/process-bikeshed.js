
var fs = require("fs")
,   jn = require("path").join
;

module.exports = [
                require("./init-bikeshed")
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
                    ctx.specsToProcess = bs;
                    cb();
                }
            ,   require("./process-specs")
            ]
;
