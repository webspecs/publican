
var lock = require("lock")()
,   timeout = 1000 * 60 * 10 // 10 minutes
;

exports.createLock = function createLockHandler (man) {
    return function createLockReturner (key, action, done) {
        man.log.info("Locking " + key);
        lock(key, function createLockLocker (release) {
            man.log.log("silly", "Processing locked key " + key);
            var tid = setTimeout(function () {
                man.log.error("Timeout on lock expired, releasing " + key + " with risk of conflict.");
                release(done)();
            }, timeout);
            action(function createLockLockerAction (err) {
                man.log.info("Releasing lock " + key);
                clearTimeout(tid);
                release(function createLockRelease () { done(err); })();
            });
        });
    };
};
