
module.exports = [
                require("./extract-the-index") // first time, get the old values
            ,   function (ctx, cb) {
                    ctx.oldIndexRepositories = ctx.theIndexRepositories;
                    ctx.theIndexRepositories = null;
                    cb();
                }
            ,   require("./init-the-index")
            ,   require("./extract-the-index") // get the updated list
            ,   function (ctx, cb) {
                    ctx.log.info("Finding new specifications to process");
                    var newRepos = [];
                    ctx.theIndexRepositories
                        .forEach(function (it) {
                            var isOld = ctx.oldIndexRepositories.some(function (old) {
                                return old.repository === it.repository &&
                                        old.branch === it.branch &&
                                        old.baseFileName === it.baseFileName;
                            });
                            if (isOld) return;
                            newRepos.push(it);
                        })
                    ;
                    ctx.specsToProcess = newRepos;
                    ctx.log.info("New specifications: " + newRepos.length);
                    cb();
                }
            ,   require("./process-specs")
            ]
;    
