
var Task = require("../task");

module.exports = new Task();
module.exports
            .add([
                require("./git-clone-or-fetch")
            ,   require("./git-publish")
            ,   require("./rsync")
            ,   require("./purge-all")
            ])
;    


