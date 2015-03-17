
// var fs = require("fs")
// ,   jn = require("path").join
// ;


// we want tasks and task groups
// any task is also a task group
// the flow is
// var script = new Task(context);
// script
//  .add([
//      gitCloneOrUpdate
//  ,   publish
//  ,   generate
//  ,   rsync
//  ])
//  .done(function...)
//  .error(function...)
//  .run()

function Task (context) {
    this.ctx = context;
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
                task(this.ctx, function (err) {
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
                });
            }
        ;
        if (!this.tasks.length) return this.doneHandler();
    }
};
module.exports = Task;
