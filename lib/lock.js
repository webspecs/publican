
var lock = require("lock")()
,   log = require("./log")
,   timeout = 1000 * 60 * 10 // 10 minutes
;

exports.lock = function (key, action, done) {
    log.info("Locking " + key);
    lock(key, function (release) {
        log.log("silly", "Processing locked key " + key);
        var tid = setTimeout(function () {
            log.error("Timeout on lock expired, releasing " + key + " with risk of conflict.");
            release(done)();
        }, timeout);
        action(function (err) {
            log.info("Releasing lock " + key);
            clearTimeout(tid);
            release(function () { done(err); })();
        });
    });
};
