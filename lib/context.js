
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   cnf = require("../lib/config")
,   log = require("./log")
,   lock = require("./lock")
;

exports.getContext = function (opt) {
    opt = opt || {};
    var ctx = {
        // common facilities
            log:        log
        ,   lock:       lock.lock
        ,   rfs:        function (file) { fs.readFileSync(file, "utf8"); }
        ,   wfs:        function (file, content) { fs.writeFileSync(file, content, { encoding: "utf8" }); }
        // common directories
        ,   dataDir:    dataDir
        ,   publishDir: jn(dataDir, "publish")
        // bikeshed details (conf has python)
        ,   bikeshed:   jn(dataDir, "bikeshed/bikeshed.py")
        }
    ;
    if (opt.repository) {
        // git details
        ctx.gitRepoURL = "git@github.com:" + opt.repository + ".git";
        ctx.gitDir  = jn(dataDir, "gits", opt.repository);
        ctx.repository = opt.repository;
    }
    if (opt.branch) ctx.branch = opt.branch;

    // copy configuration
    for (var k in cnf) ctx[k] = cnf[k];
    return ctx;
};

