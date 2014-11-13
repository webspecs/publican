
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

exports.specTables = function (path) {
    var $ = whacko.load(fs.readFileSync(path, "utf8"));
    log.info("Generating specification linking tables in the-index");
    $("script[type='application/webspec+json']")
        .each(function () {
            var $script = $(this)
            ,   ws = JSON.parse($script.text())
            ,   $dl = $("<dl class='webspec'></dl>")
            ,   na = function ($dl) {
                    $("<dd class='na'>n/a</dd>").appendTo($dl);
                }
            ,   simpleDD = function (repo, branch, $dl) {
                    var parts = repo.split("/", 2)
                    ,   $dd = $("<dd><a></a></dd>");
                    $dd.find("a")
                        .attr("href", "/" + parts[1] + "/" + parts[0] + "/" + branch)
                        .text(repo)
                    ;
                    $dd.appendTo($dl);
                }
            ;
            $("<dt>master</dt>").appendTo($dl);
            if (ws.master) simpleDD(ws.master, "master", $dl);
            else na($dl);
            $("<dt>develop</dt>").appendTo($dl);
            if (ws.develop) simpleDD(ws.develop, "develop", $dl);
            else na($dl);
            $("<dt>proposals</dt>").appendTo($dl);
            if (ws.proposals && ws.proposals.length) {
                var $innerDL = $("<dl></dl>");
                for (var j = 0, m = ws.proposals.length; j < m; j++) {
                    var prop = ws.proposals[j]
                    ,   $a = $("<a></a>")
                    ,   parts = prop.repository.split("/", 2)
                    ;
                    $a.attr("href", "/" + parts[1] + "/" + parts[0] + "/" + prop.branch)
                        .text(prop.repository + "#" + prop.branch);
                    $("<dt></dt>").append($a).appendTo($innerDL);
                    $("<dd></dd>").html(prop.description).appendTo($innerDL);
                }
                $("<dd></dd>").append($innerDL).appendTo($dl);
            }
            else {
                na($dl);
            }
            $script.replaceWith($dl);
        })
    ;
};

exports.toc = function (path) {
    var $ = whacko.load(fs.readFileSync(path, "utf8"))
    ,   toc = []
    ;
    // this is a super simplified variant
    // if h2 it goes into the top
    // otherwise it goes into the previous one
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
            if (!$h.hasClass("no-num")) $("<span class='secno'></span>").text(secno + ". ").appendTo($h);
            $("<span class='content'></span>").html(cnt).appendTo($h);
            if (!$h.hasClass("no-ref")) $("<a class='self-link'></a>").attr("href", "#" + id).appendTo($h);
        })
    ;
    function tocline (details, $parent) {
        var $li = $("<li><a></a></li>").appendTo($parent)
        ,   $a = $li.find("a")
        ;
        $a.attr("href", "#" + details.id);
        if (!details.noNum) {
            $("<span class='secno'></span>").text(details.secno).appendTo($a);
            $a.append(document.createTextNode(" "));
        }
        $("<span class='content'></span>").html(details.content).appendTo($a);
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
            $ul.appendTo($li);
        }
    }
};
