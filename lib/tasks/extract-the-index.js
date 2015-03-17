
var whacko = require("whacko");

// expects
//  theIndexPath: the path to the-index file
// sets
//  theIndexRepositories: an array of repositories extracted from the-index
//      it has: branch, repository, baseFileName
module.exports = function (ctx, cb) {
    var $ = whacko.load(ctx.rfs(ctx.theIndexPath));
    ctx.theIndexRepositories = [];
    ctx.log.info("Extracting data from the-index");
    $("script[type='application/webspec+json']")
        .each(function () {
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
