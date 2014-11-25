
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
                var data = JSON.parse($(this).text())
                ,   fileName = data.fileName || "index"
                ;
                if (data.master) res.push({ branch: "master", repository: data.master, fileName: fileName });
                if (data.develop) res.push({ branch: "develop", repository: data.develop, fileName: fileName });
                if (data.proposals && data.proposals.length) {
                    for (var i = 0, n = data.proposals.length; i < n; i++) {
                        var prop = data.proposals[i];
                        if (prop.branch.match(/\.\.|[\040\177 ~^:?*[]|\\|@\{/)) continue;
                        res.push({ branch: prop.branch, repository: prop.repository, fileName: fileName });
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

exports.transform = function (path) {
    var $ = whacko.load(fs.readFileSync(path, "utf8"));
    exports.specTables($);
    exports.toc($);
    fs.writeFileSync(path, $.html(), { encoding: "utf8" });
};

exports.specTables = function ($) {
    log.info("Generating specification linking tables in the-index");
    $("script[type='application/webspec+json']")
        .each(function () {
            var $script = $(this)
            ,   ws = JSON.parse($script.text())
            ,   $dl = $("<dl class='webspec'></dl>")
            ,   na = function ($dl) {
                    $dl.append($("<dd class='na'>n/a</dd>"));
                }
            ,   simpleDD = function (repo, branch, $dl) {
                    var parts = repo.split("/", 2)
                    ,   $dd = $("<dd><a></a></dd>");
                    $dd.find("a")
                        .attr("href", "/" + parts[1] + "/" + parts[0] + "/" + branch)
                        .text(repo)
                    ;
                    $dl.append($dd);
                }
            ;
            $dl.append($("<dt>master</dt>"));
            if (ws.master) simpleDD(ws.master, "master", $dl);
            else na($dl);
            $dl.append($("<dt>develop</dt>"));
            if (ws.develop) simpleDD(ws.develop, "develop", $dl);
            else na($dl);
            $dl.append($("<dt>proposals</dt>"));
            if (ws.proposals && ws.proposals.length) {
                var $innerDL = $("<dl></dl>");
                for (var j = 0, m = ws.proposals.length; j < m; j++) {
                    var prop = ws.proposals[j]
                    ,   $a = $("<a></a>")
                    ,   parts = prop.repository.split("/", 2)
                    ;
                    $a.attr("href", "/" + parts[1] + "/" + parts[0] + "/" + prop.branch)
                        .text(prop.repository + "#" + prop.branch);
                    $innerDL.append($("<dt></dt>").append($a));
                    $innerDL.append($("<dd></dd>").html(prop.description));
                }
                $dl.append($("<dd></dd>").append($innerDL));
            }
            else {
                na($dl);
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
