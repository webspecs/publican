
var jn = require("path").join
,   phantom = require("phantomjs")
,   execFile = require("child_process").execFile
,   querystring = require("querystring")
,   lock = require("./lock")
,   log = require("./log")
,   respec2html = jn(__dirname, "../node_modules/respec/tools/respec2html.js")
,   num2 = function (num) {
        var str = num + "";
        if (str.length >= 2) return str;
        return "0" + str;
    }
;

exports.respec = function (directory, fileName, cb) {
    if (!fileName) fileName = "index";
    if (fileName.indexOf("/") === 0 || fileName.indexOf("..") > -1) return cb("Invalid file name: " + fileName);
    lock.lock(
        "respec " + directory
    ,   function (release) {
            var d = new Date()
            ,   enforce = {
                    specStatus:     "WS"
                ,   publishDate:    [d.getFullYear(), num2(d.getMonth() + 1), num2(d.getDate())].join("-")
                }
            ,   params = [
                    "--ssl-protocol=any"
                ,   respec2html
                ,   "-e"
                ,   "-w"
                ,   jn(directory, fileName + ".src.html") + "?" + querystring.stringify(enforce)
                ,   jn(directory, "index.html")
                ]
            ;
            log.info(phantom.path + " " + params.join(" "));
            
            var timedOut = false
            ,   tickingBomb = setTimeout(
                    function () {
                        timedOut = true;
                        release("ReSpec timed out.");
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
                        log.error(stderr);
                        log.error(stdout);
                    }
                    release(err);
                }
            );
        }
    ,   cb
    );
};
