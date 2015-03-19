
var processSpec = require("./process-spec");

// expects
//  specsToProcess: an array of specs to process much like `theIndexRepositories`
module.exports = function (ctx, cb) {
    var specs = ctx.specsToProcess.concat();
    var iterate = function () {
        if (!specs.length) return cb();
        var it = specs.shift()
        ,   ctx = this.getContext(it)
        ;
        ctx.subDirOnly = ctx.specSubDir;
        this.runTask(processSpec, ctx, function (err) {
            if (err) ctx.log.error(err);
            iterate();
        });
    }.bind(this);
    iterate();
};    
