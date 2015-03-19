
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
                ,   humanReadableUnhandledException:    true
                })
        ,   new (winston.transports.File)({
                    filename:           jn(dataDir, conf.logFile)
                ,   handleExceptions:   true
                ,   timestamp:          true
                ,   humanReadableUnhandledException:    true
                })
    ];
    if (conf.email) {
        require("winston-mail");
        transports.push(new (winston.transports.Mail)(conf.email));
    }
    return new (winston.Logger)({ transports: transports })
};
