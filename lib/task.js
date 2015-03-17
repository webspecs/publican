
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
    this.errorHandler = function () {};
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
,   error:  function (cb) {
        this.errorHandler = cb;
        return this;
    }
,   run:    function () {
        var offset = 0
        ,   iterate = function () {
                var task = this.tasks[offset];
                try {
                    task(this.ctx, function (err) {
                        if (err) return this.errorHandler(err);
                        offset++;
                        if (offset === this.tasks.length) return this.doneHandler();
                        iterate();
                    });
                }
                catch (err) {
                    this.errorHandler(err);
                }
            }
        ;
        if (!this.tasks.length) return this.doneHandler();
    }
};

