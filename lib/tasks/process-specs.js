
var processSpec = require("./process-spec");

// expects
//  specsToProcess: an array of specs to process much like `theIndexRepositories`
module.exports = function processSpecs (ctx, cb) {
    var specs = ctx.specsToProcess.concat();
    ctx.log.info("Processing " + specs.length + " specifications.");
    var iterate = function processSpecsIterate () {
        if (!specs.length) return cb();
        var it = specs.shift()
        ,   ctx = this.getContext(it)
        ;
        ctx.subDirOnly = ctx.specSubDir;
        this.runTask(processSpec, ctx, function processSpecsRunTask (err) {
            if (err) ctx.log.error(err);
            iterate();
        });
    }.bind(this);
    iterate();
};    
