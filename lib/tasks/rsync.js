
var exec = require("child_process").exec
,   pth = require("path")
,   jn = pth.join
,   fs = require("fs-extra")
,   excludes = ".git .gitignore README.md LICENSE CONTRIBUTING.md .DS_Store '*.php' '*.php3' '*.php4' '*.php5' '*.cgi' '*.sh'".split(" ")
;

function trail (str) {
    return (/\/$/.test(str)) ? str : str + "/";
}


//     rsync --no-perms -az --omit-dir-times -e ssh \
//           --stats --progress path/to/publican/data/publish/ \
// 
// webapps@rsync.specs.webplatform.org:/srv/webapps/publican/data/publish/


// expects
//  rsyncRemote:    the user@host of the remote rsync service
//  rsyncPath:      the remote path
//  rsyncDelete:    whether to delete remote files not present locally
//  publishDir:     the local directory with the content
//  subDirOnly:     only rsync the given subdir, if given
module.exports = function (ctx, cb) {
    var cmd = ["rsync -avz"]
    ,   from = ctx.subDirOnly ? jn(ctx.publishDir, ctx.subDirOnly) : ctx.publishDir
    ,   toPath = ctx.subDirOnly ? jn(ctx.rsyncPath, ctx.subDirOnly) : ctx.rsyncPath
    ,   to = (ctx.rsyncRemote ? ctx.rsyncRemote + ":" : "") + toPath
    ,   stat = fs.statSync(from)
    ,   preparePath = toPath
    ,   rsyncOpts = []
    ;
    if (stat.isDirectory()) {
        from = trail(from);
        to = trail(to);
    }
    else {
        preparePath = pth.dirname(preparePath);
    }
    if (ctx.rsyncDelete) rsyncOpts.push("--delete");
    rsyncOpts.push("--exclude");
    rsyncOpts.push(excludes.join(" --exclude "));
    rsyncOpts.push('--out-format="%n"');
    rsyncOpts.push('--no-perms');
    rsyncOpts.push('--omit-dir-times');
    if (ctx.rsyncRemote) cmd.push(rsyncOpts.join(" ") + ' --rsync-path="mkdir -p ' + preparePath + ' && rsync"');
    else fs.mkdirpSync(preparePath);
    // cmd.push(rsyncOpts.join(" "));
    cmd.push("-e ssh");
    cmd.push(from);
    cmd.push(to);
    
    ctx.lock(
        "rsync " + from + " " + to
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
