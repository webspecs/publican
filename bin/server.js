#!/usr/bin/env node

var express = require("express")
,   app = express()
,   pth = require("path")
,   jn = pth.join
,   Manager = require("../lib/manager")
,   log = require("../lib/log")
,   queue = require("../lib/queue")
,   extractTheIndex = require("../lib/tasks/extract-the-index")
,   version = require("../package.json").version
,   pollInterval = 1000 * 10 // 10 seconds, this is slow, may need to increase later
,   nopt = require("nopt")
,   knownOpts = {
        config:     pth
    }
,   shortHands = {
        c:      ["--config"]
    }
,   options = nopt(knownOpts, shortHands, process.argv, 2)
;

app.use(require("body-parser").json());

app.get("/", function (req, res) {
    log.info("Hit on root");
    res.json({ publican: version });
});

function ok (res, details) {
    var obj = { ok: true };
    if (details) {
        obj.details = details;
        log.info(details);
    }
    return res.json(obj);
}

app.post("/hook", function (req, res) {
    var data = req.body
    ,   branch
    ,   repo
    ,   refRx = /refs\/(tags|heads)\/(.*)$/
    ;
    if (!data) return res.status(500).json({ error: "No payload." });

    var matches = (data.ref || "").match(refRx);
    if (matches) {
        if (matches[1] === "heads") branch = matches[2];
        if ( matches[1] === "tags" ) return ok(res, "Ignoring tags for now.");
    }
    // if branch wasn't found, use base_ref if available
    if (!branch && data.base_ref) branch = data.base_ref.replace(refRx, "$2");
    repo = data.repository ? (data.repository.owner.name + "/" + data.repository.name) : null;

    log.info("Processing request for " + repo + "#" + branch);
    if (!branch || !repo) return ok(res, "Could not find repo or branch in data.");
    log.info("Hook for " + repo + ", branch " + branch);
    
    var man = new Manager(options)
    ,   ctx = man.getContext();
    ctx.theIndexPath = jn(ctx.publishDir, "index.html");
    man.runTask(extractTheIndex, ctx, function (err) {
        if (err) return log.error(err);
        var known = ctx.theIndexRepositories.some(function (it) {
            return it.repository === repo && it.branch === branch;
        });
        if (!known) return ok(res, "Repository or branch not in the wanted list, maybe add them to the-index?");
        queue.enqueue(repo, branch, function (err, stamp) {
            var msg = "Queued " + stamp + " for processing.";
            ok(res, msg);
        });
    });
});

app.all("*", function (req, res) {
    log.info("Fallback hit: " + req.originalUrl);
    res.status(404).json({ error: "No matching endpoint." });
});

function poll () {
    queue.next(function (err, next) {
        if (!next) return setTimeout(poll, pollInterval);
        log.info("Found item in queue, processing " + JSON.stringify(next));
        var man = new Manager(options);
        man.runAppropriateTask(next, function (err) {
            if (err) log.error(err);
            process.nextTick(poll);
        });
    });
}
poll();

app.listen(7002);
log.info("Publican/" + version + " up and running.");
