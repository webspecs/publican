
var whacko = require("whacko")
,   jn = require("path").jn
;

// expects
//  theIndexPath: the path to the-index file
//  publishDir: the directory to publish to
module.exports = function (ctx, cb) {
    console.log("ENTER GENERATE", ctx.theIndexPath);
    console.log(ctx.rfs(ctx.theIndexPath));
    var $ = whacko.load(ctx.rfs(ctx.theIndexPath));
    console.log("LOADED DOM");
    
    // make the tables
    ctx.log.info("Generating specification linking tables in the-index");
    $("script[type='application/webspec+json']")
        .each(function () {
            console.log("PROCESSING JSON");
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
    
    // build the ToC
    var toc = [];
    ctx.log.info("Building ToC for the-index");
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
    var tocline = function (details, $parent) {
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
    };
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
    ctx.wfs(jn(ctx.publishDir, "index.html"), $.html());
    cb();
};
