#!/usr/bin/env node

var express = require("express")
,   app = express()
// ,   gith = require("gith").create(7002)
,   fs = require("fs")
,   jn = require("path").join
,   man = require("../lib/manager")
,   log = require("../lib/log")
,   queue = require("../lib/queue")
,   dataDir = jn(__dirname, "../data")
,   wantedFile = jn(dataDir, "wanted.json")
,   version = require("../package.json").version
,   pollInterval = 1000 * 10 // 10 seconds, this is slow, may need to increase later
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
    var wanted = JSON.parse(fs.readFileSync(wantedFile, "utf8"));
    if (!wanted[repo]) return ok(res, "Repository not in the wanted list, maybe add it to the-index?");
    if (!wanted[repo].branches[branch]) return ok(res, "Branch not in the wanted list, maybe add it to the-index?");
    var stamp = queue.enqueue(repo, branch)
    ,   msg = "Queued " + stamp + " for processing."
    ;
    
    return ok(res, msg);
});

app.all("*", function (req, res) {
    log.info("Fallback hit: " + req.originalUrl);
    res.status(404).json({ error: "No matching endpoint." });
});

function poll () {
    var next = queue.next();
    // console.log("Polling", next);
    if (!next) return setTimeout(poll, pollInterval);
    log.info("Found item in queue, processing " + JSON.stringify(next));
    man.processRepository(next, function (err) {
        if (err) log.error(err);
        process.nextTick(poll);
    });
}
poll();

app.listen(7002);
log.info("Publican/" + version + " up and running.");
