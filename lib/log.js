
var winston = require("winston")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
;

exports.createLogger = function (conf) {
    var transports = [
            new (winston.transports.Console)({
                    handleExceptions:   true
                ,   colorize:           true
                ,   maxsize:            200000000
                })
        ,   new (winston.transports.File)({
                    filename:           jn(dataDir, conf.logFile)
                ,   handleExceptions:   true
                ,   timestamp:          true
                })
    ];
    if (conf.email) {
        require("winston-mail");
        transports.push(new (winston.transports.Mail)(conf.email));
    }
    var logger = new (winston.Logger)({ transports: transports })
    ,   oldLogFunc = logger.log;
    logger.log = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length >= 2 && args[1] instanceof Error) args[1] = args[1].stack;
        return oldLogFunc.apply(this, args);
    };
    return logger;
};
