
var winston = require("winston")
,   conf = require("../data/config.json")
,   jn = require("path").join
,   dataDir = jn(__dirname, "../data")
,   transports = [
        new (winston.transports.Console)({
                handleExceptions:   true
            ,   colorize:           true
            ,   maxsize:            200000000
            })
    ,   new (winston.transports.File)({
                filename:           jn(dataDir, conf.log)
            ,   handleExceptions:   true
            ,   timestamp:          true
            })
    ]
;

if (conf.email) {
    require("winston-mail");
    transports.push(new (winston.transports.Mail)(conf.email));
}

module.exports = new (winston.Logger)({ transports: transports });
