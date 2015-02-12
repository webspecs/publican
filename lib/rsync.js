
var exec = require("child_process").exec
// XXX
//  is it possible to exclude files that haven't changed apart from in their modified time?
,   excludes = ".git .gitignore README.md LICENSE CONTRIBUTING.md .DS_Store '*.php' '*.php3' '*.php4' '*.php5' '*.cgi'".split(" ")
,   lock = require("./lock")
,   log = require("./log")
,   url = require("url")
,   sua = require("superagent")
,   seen = {}
,   purge = function (url) {
        if (seen[url]) return;
        seen[url] = true;
        sua("PURGE", url).end(function () {
            log.info("Purged " + url);
        });
    }
;

// just runs the tool and reports on result
//  from: required source, including trailing / preferred
//  to: required destination, including trailing / preferred (but match 'from')
//  delete: boolean defaulting to off, delete remote content
//  debug: have it output some info
exports.rsync = function (opt, cb) {
    var cmd = ["rsync -avz"];
    if (opt.delete) cmd.push("--delete");
    cmd.push("--exclude");
    cmd.push(excludes.join(" --exclude "));
    cmd.push('--out-format="%n"');
    cmd.push("-e ssh");
    if (!opt.from) return cb(new Error("Missing 'from' argument."));
    cmd.push(opt.from);
    if (!opt.to) return cb(new Error("Missing 'to' argument."));
    cmd.push(opt.to);
    
    lock.lock(
        "rsync " + opt.from + " " + opt.to
    ,   function (release) {
            log.info(cmd.join(" "));
            exec(cmd.join(" "), function (err, stdoud, stderr) {
                seen = {};
                stdoud.split("\n")
                        .filter(function (file) {
                            if (
                                /^\s*$/.test(file) ||
                                /building file list/.test(file) ||
                                /cannot delete non-empty directory/.test(file) ||
                                /sent \d+ bytes/.test(file) ||
                                /deleting /.test(file) ||
                                /sending incremental file list/.test(file) ||
                                /total size is \d+/.test(file)
                                ) return false;
                            return true;
                        })
                        .map(function (file) {
                            return url.resolve("https://specs.webplatform.org/", file);
                        })
                        .forEach(function (url) {
                            if (/index\.html$/.test(url)) purge(url.replace(/index\.html$/, ""));
                            purge(url);
                        })
                ;
                log.log("silly", "STDOUT:<<<" + stdoud + ">>>");
                if (stderr) log.warn("STDERR:<<<" + stderr + ">>>");
                release(err);
            });
        }
    ,   cb
    );
};
