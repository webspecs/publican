
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
                for (var k in data) {
                    var arr = k.split("#")
                    ,   repository = arr[0]
                    ,   branch = arr[1]
                    ,   fileName = data[k].fileName || "index"
                    ;
                    if (branch.match(/\.\.|[\040\177 ~^:?*[]|\\|@\{/)) continue;
                    res.push({ branch: branch, repository: repository, fileName: fileName });
                }
            }
            catch (e) {
                log.error(e);
            }
        })
    ;
    return res;
};

exports.transform = function (src, dest) {
    var $ = whacko.load(fs.readFileSync(src, "utf8"));
    exports.specTables($);
    exports.toc($);
    fs.writeFileSync(dest, $.html(), { encoding: "utf8" });
};

exports.specTables = function ($) {
    log.info("Generating specification linking tables in the-index");
    $("script[type='application/webspec+json']")
        .each(function () {
            var $script = $(this)
            ,   ws = JSON.parse($script.text())
            ,   $dl = $("<dl class='webspec'></dl>")
            ,   simpleDD = function (desc, $dl) {
                    $dl.append($("<dd></dd>").html(desc || "n/a"));
                }
            ,   linkDT = function (repo, $dl) {
                    var parts = repo.split("/", 2)
                    ,   user = parts[0]
                    ,   $dt = $("<dt><a></a></dt>");
                    parts = parts[1].split("#");
                    var spec = parts[0]
                    ,   branch = parts[1]
                    ;
                    $dt.find("a")
                        .attr("href", "/" + spec + "/" + user + "/" + branch)
                        .text(repo)
                    ;
                    $dl.append($dt);
                }
            ;
            for (var k in ws) {
                linkDT(k, $dl);
                simpleDD(ws[k].description, $dl);
            }
            $script.after($dl);
        })
    ;
};

exports.toc = function ($) {
    var toc = [];
    // this is a super simplified variant
    // if h2 it goes into the top
    // otherwise it goes into the previous one
    log.info("Building ToC for the-index");
    $("section")
        .each(function () {
            var $section = $(this)
            ,   topLevel = !!$section.find("h2").length
            ,   $h = $section.find(topLevel ? "h2" : "h3").first()
            ,   id = $h.attr("id")
            ,   cnt = $h.html()
            ,   secno = topLevel ? toc.length + 1 : (toc.length) + "." + (toc[toc.length - 1].children.length + 1)
            ;
            if ($h.hasClass("no-ref")) return;
            if (topLevel) {
                toc.push({
                    content:    cnt
                ,   id:         id
                ,   secno:      secno
                ,   children:   []
                ,   noNum:      $h.hasClass("no-num")
                });
            }
            else {
                toc[toc.length - 1].children.push({
                    content:    cnt
                ,   id:         id
                ,   secno:      secno
                ,   noNum:      $h.hasClass("no-num")
                });
            }
            $h.addClass("heading settled");
            $h.empty();
            if (!$h.hasClass("no-num")) $h.append($("<span class='secno'></span>").text(secno + ". "));
            $h.append($("<span class='content'></span>").html(cnt));
            if (!$h.hasClass("no-ref")) $h.append($("<a class='self-link'></a>").attr("href", "#" + id));
        })
    ;
    function tocline (details, $parent) {
        var $li = $("<li><a></a></li>")
        ,   $a = $li.find("a")
        ;
        $a.attr("href", "#" + details.id);
        if (!details.noNum) {
            $a.append($("<span class='secno'></span>").text("" + details.secno)); // number cause the tree serialiser to blow up…
            $a.append(" ");
        }
        $a.append($("<span class='content'></span>").html(details.content));
        $parent.append($li);
        return $li;
    }
    var $tocUL = $("#toc");
    for (var i = 0, n = toc.length; i < n; i++) {
        var topSec = toc[i]
        ,   $li = tocline(topSec, $tocUL);
        if (topSec.children && topSec.children.length) {
            var $ul = $("<ul class='toc'></ul>");
            for (var j = 0, m = topSec.children.length; j < m; j++) {
                var kid = topSec.children[j];
                tocline(kid, $ul);
            }
            $li.append($ul);
        }
    }
};
