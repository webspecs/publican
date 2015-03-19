
var lock = require("lock")()
,   timeout = 1000 * 60 * 10 // 10 minutes
;

exports.createLock = function (man) {
    return function (key, action, done) {
        man.log.info("Locking " + key);
        lock(key, function (release) {
            man.log.log("silly", "Processing locked key " + key);
            var tid = setTimeout(function () {
                man.log.error("Timeout on lock expired, releasing " + key + " with risk of conflict.");
                release(done)();
            }, timeout);
            action(function (err) {
                man.log.info("Releasing lock " + key);
                clearTimeout(tid);
                release(function () { done(err); })();
            });
        });
    };
};
