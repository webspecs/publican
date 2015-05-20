
var request = require("request");

// expects:
//  purgeAllURL:    the URL to purge Fastly
//  purgeAllKey:    the key for the Fastly service
module.exports = function (ctx, cb) {

    var options = {
          url: ctx.purgeAllURL
        , method: 'POST'
        , headers: {
                  'User-Agent': 'WebPlatformPublican/1'
                , 'Fastly-Key': ctx.purgeAllKey
        }
    };

    return request(options, function requestCallback(error, response, body) {
        var info = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            console.log('Purge worked', info);
            return cb();
        } else {
            cb( new Error('Error purging, message ', info ) );
        }
    });

};

