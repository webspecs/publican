
var request = require("request");

module.exports = function (ctx, cb) {

    var parts = ctx.repository.split("/", 2);
    var options = {
              url: 'https://specs.webplatform.org/'
            , method: 'PURGE'
            , headers: {
                'User-Agent': 'WebPlatformPublican/1'
            }
        };

    options.url += parts[1] + '/' + parts[0] + '/' + ctx.branch;

    return request(options, function purgeRequestHandler (error, response, body) {
        var info = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            console.log('Purge worked on ' + options.url, info);
            return cb();
        } else {
            return cb(new Error('Error purging ' + options.url, info));
        }
    });

};
