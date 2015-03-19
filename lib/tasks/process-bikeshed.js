
var fs = require("fs")
,   jn = require("path").join
;

module.exports = [
                require("./init-bikeshed")
            ,   require("./extract-the-index")
            ,   function (ctx, cb) {
                    // XXX
                    //  it is not clear that this works and that bikeshed specs are indeed updated
                    //  when bikeshed is
                    //  I'm not far from thinking that this is a feature: this is a setup that is
                    //  prone to crashing things, especially in view of older specs lying around
                    
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
