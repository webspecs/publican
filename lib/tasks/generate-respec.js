
var jn = require("path").join
,   phantom = require("phantomjs")
,   execFile = require("child_process").execFile
,   querystring = require("querystring")
,   respec2html = jn(__dirname, "../node_modules/respec/tools/respec2html.js")
,   num2 = function (num) {
        var str = num + "";
        if (str.length >= 2) return str;
        return "0" + str;
    }
;

// expects
//  specDir: the path to the directory in which the spec lives
//  baseFileName: the base file name, without extension, to use (defaults to index)
//  repository: the repository in user/repo form
module.exports = function (ctx, cb) {
    var fn = ctx.baseFileName;
    if (fn.indexOf("/") === 0 || fn.indexOf("..") > -1) return cb("Invalid file name: " + fn);
    ctx.lock(
        "respec " + ctx.specDir
    ,   function (release) {
            var d = new Date()
            ,   enforce = {
                    specStatus:     "webspec"
                ,   publishDate:    [d.getFullYear(), num2(d.getMonth() + 1), num2(d.getDate())].join("-")
                ,   repository:     ctx.repository
                }
            ,   params = [
                    "--ssl-protocol=any"
                ,   respec2html
                ,   "-e"
                ,   "-w"
                ,   jn(ctx.specDir, fn + ".src.html") + "?" + querystring.stringify(enforce, ";")
                ,   jn(ctx.specDir, "index.html")
                ]
            ;
            ctx.log.info(phantom.path + " " + params.join(" "));
            
            var timedOut = false
            ,   tickingBomb = setTimeout(
                    function () {
                        timedOut = true;
                        release(new Error("ReSpec timed out."));
                    }
                ,   10 * 1000
                )
            ;
            execFile(
                phantom.path
            ,   params
            ,   function (err, stdout, stderr) {
                    if (timedOut) return;
                    clearTimeout(tickingBomb);
                    if (err) {
                        ctx.log.error(stderr);
                        ctx.log.error(stdout);
                    }
                    release(err);
                }
            );
        }
    ,   cb
    );
};
