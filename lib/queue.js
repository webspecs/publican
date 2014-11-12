
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   queueDir = jn(dataDir, "queue")
;

exports.enqueue = function (repo, branch) {
    var stamp = Date.now() + "-" + process.hrtime()[1];
    fs.writeFileSync(
        jn(queueDir, stamp + ".json")
    ,   JSON.stringify({ repository: repo, branch: branch }, null, 4)
    ,   { encoding: "utf8" }
    );
    return stamp;
};

exports.next = function () {
    var queue = fs.readdirSync(queueDir)
                    .sort(function (a, b) { // we have to do this to guarantee numeric comparison
                        if (a < b) return -1;
                        if (a > b) return 1;
                        return 0;
                    })
    ;
    if (!queue.length) return null;
    var top = queue[0]
    ,   file = jn(queueDir, top)
    ,   content = JSON.parse(fs.readFileSync(file))
    ;
    fs.unlinkSync(file);
    return content;
};
