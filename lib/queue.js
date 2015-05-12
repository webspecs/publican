
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   queueDir = jn(dataDir, "queue")
;

exports.enqueue = function enqueueHandler (repo, branch, cb) {
    var stamp = Date.now() + "-" + process.hrtime()[1];
    fs.writeFile(
        jn(queueDir, stamp + ".json")
    ,   JSON.stringify({ repository: repo, branch: branch }, null, 4)
    ,   { encoding: "utf8" }
    ,   function enqueueCallbackHandler (err) {
            if (err) throw err;
            cb(null, stamp);
        }
    );
};

exports.next = function enqueueNextHandler (cb) {
    fs.readdir(queueDir, function enqueueNextReadDirHandler (err, queue) {
        if (err) throw err;
        queue = queue
                    .sort(function enqueueNextReadDirSortHandler (a, b) { // we have to do this to guarantee numeric comparison
                        if (a < b) return -1;
                        if (a > b) return 1;
                        return 0;
                    });
        if (!queue.length) return cb(null, null);
        var top = queue[0]
        ,   file = jn(queueDir, top)
        ;
        fs.readFile(file, { encoding: "utf8" }, function enqueueNextReadFileHandler (err, content) {
            if (err) throw err;
            var content = JSON.parse(content);
            fs.unlink(file, function enqueueNextReadFileUnlinkHandler (err) {
                if (err) throw err;
                cb(null, content);
            });
        });
    });
};

// XXX
//  - this should have a a limbo dir
//      - when dequeuing, move to limbo
//      - on success, unlink
//      - if there are limbo files at start, process those first
//      - keep a counter of the files re-processed from limbo so we avoid loops
