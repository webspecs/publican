
var fs = require("fs-extra")
,   clone = require("./git-clone")
,   fetch = require("./git-fetch")
;

// expects:
//  gitDir:     the directory in which the repo is stored
module.exports = function (ctx, cb) {
    fs.exists(ctx.gitDir, function (exists) {
        this.runTask(exists ? fetch : clone, cb);
    }.bind(this));
};
