
var fs = require("fs-extra")
,   clone = require("./git-clone")
,   fetch = require("./git-fetch")
;

// expects:
//  gitDir:     the directory in which the repo is stored
module.exports = function gitCloneOrFetchExports (ctx, cb) {
    fs.exists(ctx.gitDir, function gitCloneOrFetchFileExistsHandler (exists) {
        this.runTask(exists ? fetch : clone, ctx, cb);
    }.bind(this));
};
