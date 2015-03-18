
var sua = require("superagent")
;

// expects:
//  purgeAllURL:    the URL to purge Fastly
//  purgeAllKey:    the key for the Fastly service
module.exports = function (ctx, cb) {
    sua.post(ctx.purgeAllURL)
        .set("Fastly-Key", ctx.purgeAllKey)
        .set('Accept', 'application/json')
        .end(function (err, res) {
            if (!err && res.body && res.body.status === "ok") return cb();
            cb(new Error(res.body ? res.body.status : "No response body for purge"));
        })
    ;
};
