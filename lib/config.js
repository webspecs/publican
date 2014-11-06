
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
;

exports.readConfiguration = function () {
    return JSON.parse(fs.readFileSync(jn(dataDir, "config.json"), "utf8"));
};
