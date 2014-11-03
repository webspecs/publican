
var exec = require("child_process").exec
,   excludes = ".git README.md LICENSE CONTRIBUTING.md .DS_Store".split(" ")
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
    cmd.push("-e ssh");
    if (!opt.from) return cb(new Error("Missing 'from' argument."));
    cmd.push(opt.from);
    if (!opt.to) return cb(new Error("Missing 'to' argument."));
    cmd.push(opt.to);
    if (opt.debug) console.log(cmd.join(" "));
    exec(cmd.join(" "), function (err, stdoud, stderr) {
        if (err) return cb(err);
        if (opt.debug) {
            console.log("STDOUT:<<<" + stdoud + ">>>");
            console.log("STDERR:<<<" + stderr + ">>>");
        }
        cb(null);
    });
};
