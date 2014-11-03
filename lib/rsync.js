
var exec = require("child_process")
;

// from and to
// option to specify --delete
// just runs the tool and reports on result based on output
// rsync -avze ssh /Projects/berjon.com/heliodor/publish/ robin@$POLITY:/var/www/sites/berjon.com/public/
exports.rsync = function (opt, cb) {
    var cmd = ["rsync -avze"];
    if (opt.delete) cmd.push("--delete");
    if (!opt.from) return cb(new Error("Missing 'from' argument."));
    cmd.push(opt.from);
    if (!opt.to) return cb(new Error("Missing 'to' argument."));
    cmd.push(opt.to);
    exec(cmd.join(" "), function (err, stdoud, stderr) {
        if (err) return cb(err);
        console.log("STDOUT:<<<" + stdoud + ">>>");
        console.log("STDERR:<<<" + stderr + ">>>");
        cb(null);
    });
};
