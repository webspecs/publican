
var exec = require("child_process").exec
,   excludes = ".git .gitignore README.md LICENSE CONTRIBUTING.md .DS_Store '*.php' '*.php3' '*.php4' '*.php5' '*.cgi'".split(" ")
;

// expects
//  rsyncRemote:    the user@host of the remote rsync service
//  rsyncPath:      the remote path
//  rsyncDelete:    whether to delete remote files not present locally
//  publishDir:     the local directory with the content
module.exports = function (ctx, cb) {
    var cmd = ["rsync -avz"]
    ,   to = ctx.rsyncRemote + ":" + ctx.rsyncPath
    ;
    if (ctx.rsyncDelete) cmd.push("--delete");
    cmd.push("--exclude");
    cmd.push(excludes.join(" --exclude "));
    cmd.push('--out-format="%n"');
    cmd.push("-e ssh");
    cmd.push(ctx.publishDir);
    cmd.push(to);
    
    ctx.lock(
        "rsync " + ctx.publishDir + " " + to
    ,   function (release) {
            ctx.log.info(cmd.join(" "));
            exec(cmd.join(" "), function (err, stdoud, stderr) {
                ctx.log.log("silly", "STDOUT:<<<" + stdoud + ">>>");
                if (stderr) ctx.log.warn("STDERR:<<<" + stderr + ">>>");
                release(err);
            });
        }
    ,   cb
    );
};
