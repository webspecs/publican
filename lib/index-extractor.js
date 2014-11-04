
var whacko = require("whacko")
,   fs = require("fs")
;

// extract(path, debug)
//  - path: the required path to the index.html that holds the index
//  - debug: set to true to dump some information
//  returns a list of repositories and branches that are needed
exports.extract = function (path, debug) {
    var $ = whacko.load(fs.readFileSync(path, "utf8"))
    ,   selector = "dl.webspec" + (debug ? "" : ":not([data-example])") + " > dt" //"
    ,   res = []
    ;
    $(selector)
        .each(function () {
            var $dt = $(this)
            ,   $dd = $dt.next("dd")
            ,   type = $dt.text()
            ;
            if (!($dd && $dd.length)) {
                if (debug) console.error("No <dd> found for " + type);
                return;
            }
            if (type === "master" || type === "develop") {
                if ($dd.hasClass("na")) return;
                res.push({ branch: type, repository: $dd.text() });
            }
            else if (type === "proposals") {
                $dd.find("dt")
                    .each(function () {
                        var spec = $(this).find("a").text()
                        ,   match = spec.match(/^(\w[^\/]*\/\w[^#\/]*)#(.*)$/)
                        ,   branch = match[2]
                        ;
                        // invalid branch names
                        if (branch.match(/\.\.|[\040\177 ~^:?*[]|\\|@\{/)) return;
                        if (match) {
                            res.push({ branch: branch, repository: match[1] });
                        }
                        else {
                            console.error("Could not match for spec: '" + spec + "'");
                        }
                    });
            }
            else if (debug) {
                console.error("Unknown type: " + type);
            }
        });
    return res;
};
