
var whacko = require("whacko")
,   fs = require("fs")
,   log = require("./log")
;

// extract(path, debug)
//  - path: the required path to the index.html that holds the index
//  returns a list of repositories and branches that are needed
exports.extract = function (path) {
    var $ = whacko.load(fs.readFileSync(path, "utf8"))
    ,   res = []
    ;
    log.info("Extracting data from the-index");
    $("script[type='application/webspec+json']")
        .each(function () {
            try {
                var data = JSON.parse($(this).text());
                if (data.master) res.push({ branch: "master", repository: data.master });
                if (data.develop) res.push({ branch: "develop", repository: data.develop });
                if (data.proposals && data.proposals.length) {
                    for (var i = 0, n = data.proposals.length; i < n; i++) {
                        var prop = data.proposals[i];
                        if (prop.branch.match(/\.\.|[\040\177 ~^:?*[]|\\|@\{/)) continue;
                        res.push({ branch: prop.branch, repository: prop.repository });
                    }
                }
            }
            catch (e) {
                log.error(e);
            }
        })
    ;
    return res;
};
