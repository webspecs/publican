
var fs = require("fs-extra")
,   Task = require("../task")
,   clone = require("./git-clone")
,   fetch = require("./git-fetch")
;

// expects:
//  gitDir:     the directory in which the repo is stored
module.exports = function (ctx, cb) {
    fs.exists(ctx.gitDir, function (exists) {
        Task.runTask(exists ? fetch : clone, cb);
    });
};
