
var winston = require("winston")
,   man = require("./manager")
,   conf = man.readConfiguration()
;

// maybe add Mail transport just for unhandled exceptions?
module.exports = new (winston.Logger)({
                        transports: [
                            new (winston.transports.Console)({
                                    handleExceptions:   true
                                ,   colorize:           true
                                ,   maxsize:            200000000
                                })
                        ,   new (winston.transports.File)({
                                    filename:           conf.log
                                ,   handleExceptions:   true
                                ,   timestamp:          true
                                })
                        ]
                    }
);
