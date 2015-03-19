
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   conf = require(jn(dataDir, "config.json"))
,   log = require("./log")
,   lock = require("./lock")
;

