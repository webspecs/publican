
var exec = require("child_process").exec
,   jn = require("path").join
,   fs = require("fs-extra")
,   excludes = ".git .gitignore README.md LICENSE CONTRIBUTING.md .DS_Store '*.php' '*.php3' '*.php4' '*.php5' '*.cgi' '*.sh'".split(" ")
;

function trail (str) {
    return (/\/$/.test(str)) ? str : str + "/";
}

// expects
//  rsyncRemote:    the user@host of the remote rsync service
//  rsyncPath:      the remote path
//  rsyncDelete:    whether to delete remote files not present locally
//  publishDir:     the local directory with the content
//  subDirOnly:     only rsync the given subdir, if given
module.exports = function (ctx, cb) {
    var cmd = ["rsync -avz"]
    ,   from = ctx.subDirOnly ? jn(ctx.publishDir, ctx.subDirOnly) : ctx.publishDir
    ,   toPath = (ctx.subDirOnly ? jn(ctx.rsyncPath, ctx.subDirOnly) : ctx.rsyncPath)
    ,   to = (ctx.rsyncRemote ? ctx.rsyncRemote + ":" : "") + toPath
    ,   stat = fs.statSync(from)
    ;
    if (stat.isDirectory()) {
        from = trail(from);
        to = trail(to);
    }
    if (ctx.rsyncDelete) cmd.push("--delete");
    cmd.push("--exclude");
    cmd.push(excludes.join(" --exclude "));
    cmd.push('--out-format="%n"');
    if (ctx.rsyncRemote) cmd.push('--rsync-path="mkdir -p ' + toPath + ' && rsync"');
    else fs.mkdirpSync(toPath);
    cmd.push("-e ssh");
    cmd.push(from);
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
