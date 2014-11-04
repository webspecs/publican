
var fs = require("fs")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   ie = require("./index-extractor")
,   specialRepositories = [
        {
            repository: "webspecs/the-index"
        ,   branches:   {
                master: "/"
            }
        ,   noDelete:   true
        }
    ,   {
            repository: "webspecs/assets"
        ,   branches:   {
                master: "/assets/"
            }
        }
    ,   {
            repository: "webspecs/documentation"
        ,   branches:   {
                master: "/project/"
            }
        }
    ,   {
            repository: "webspecs/bikeshed"
        ,   branches:   {
                master: "../bikeshed/"
            }
        }
    ]
;

exports.ensureDirs = function () {
    "gits publish bikeshed"
        .split(" ")
        .forEach(function (dir) {
            dir = jn(dataDir, dir);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        })
    ;
};

// XXX add caching
exports.listRepositories = function () {
    var repos = {}, res = [];
    ie.extract(jn(dataDir, "publish/index.html"))
        .forEach(function (it) {
            if (!repos[it.repository]) repos[it.repository] = [];
            repos[it.repository].push(it.branch);
        })
    ;
    for (var k in repos) {
        var obj = { repository: k, branches: {} };
        repos[k].forEach(function (branch) {
            obj.branches[branch] = "/" + k + "/" + branch + "/";
        });
        res.push(obj);
    }
    return [].concat(specialRepositories).concat(res);
};
