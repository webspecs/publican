
var whacko = require("whacko")
,   fs = require("fs")
;

// expects
//  theIndexPath: the path to the-index file
// sets
//  theIndexRepositories: an array of repositories extracted from the-index
//      it has: branch, repository, baseFileName
module.exports = function extractTheIndex (ctx, cb) {
    ctx.theIndexRepositories = [];
    if (!fs.existsSync(ctx.theIndexPath)) return cb();
    var $ = whacko.load(ctx.rfs(ctx.theIndexPath));
    ctx.log.info("Extracting data from the-index");
    $("script[type='application/webspec+json']")
        .each(function extractTheIndexSeekLoop () {
            try {
                var data = JSON.parse($(this).text());
                for (var k in data) {
                    var arr = k.split("#")
                    ,   repository = arr[0]
                    ,   branch = arr[1]
                    ,   fileName = data[k].fileName || "index"
                    ;
                    if (branch.match(/\.\.|[\040\177 ~^:?*[]|\\|@\{/)) continue;
                    ctx.theIndexRepositories.push({
                                                branch:         branch
                                            ,   repository:     repository
                                            ,   baseFileName:   fileName
                    });
                }
            }
            catch (e) {
                return cb(e);
            }
        })
    ;
    cb();
};
