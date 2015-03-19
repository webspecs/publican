
function Task (context, manager) {
    this.ctx = context || {};
    this.man = manager;
    this.tasks = [];
    this.doneHandler = function () {};
    this.errorHandler = function (err) { throw err; };
}
Task.prototype = {
    add:    function (tasks) {
        this.tasks = this.tasks.concat(tasks);
        return this;
    }
,   done:   function (cb) {
        this.doneHandler = cb;
        return this;
    }
,   context:   function (ctx) {
        this.ctx = ctx;
        return this;
    }
,   error:  function (cb) {
        this.errorHandler = cb;
        return this;
    }
,   runTask:    function (task, cb) {
        if (task.run) {
            task.context(this.ctx)
                .error(this.errorHandler)
                .done(cb)
                .run()
            ;
        }
        else {
            try {
                task.call(this, this.ctx, function (err) {
                    if (err) return this.errorHandler(err);
                    cb();
                });
            }
            catch (err) {
                this.errorHandler(err);
            }
        }
    }
,   run:    function () {
        var offset = 0
        ,   iterate = function () {
                this.runTask(this.tasks[offset], function () {
                    offset++;
                    if (offset === this.tasks.length) return this.doneHandler();
                    iterate();
                }.bind(this));
            }.bind(this)
        ;
        if (!this.tasks.length) return this.doneHandler();
        iterate();
    }
};
module.exports = Task;
