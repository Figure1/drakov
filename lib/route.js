var logger = require('./logger');
var content = require('./content');
var specSchema = require('./spec-schema');

exports.getRouteHandlers = function (method, parsedUrl, action) {

    var getResponseHandler = function (specPairs) {
        return function (req, res) {
            var buildResponseBody = function(specBody){
                switch (typeof specBody) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        return new Buffer(specBody);
                    case 'object':
                        return new Buffer(JSON.stringify(specBody));
                    default:
                        return specBody;
                }
            };

            var matchRequests = function (specPair){
                if (content.matches(req, specPair)) {
                    logger.log('[DRAKOV]'.red, action.method.green, parsedUrl.uriTemplate.yellow, (specPair.request && specPair.request.description ? specPair.request.description : action.name).blue);

                    specPair.response.headers.forEach(function (header) {
                        res.set(header.name, header.value);
                    });
                    res.status(+specPair.response.name);
                    res.send(buildResponseBody(specPair.response.body));
                    return true;
                }

                return false;

            };

            return specPairs.some(matchRequests);

        };
    };

    var routeHandlers = action.examples.map(function (example) {
        var specPairs = [];

        var makePair = function (response, index){
            var specPair = {
                response: response,
                request: 'undefined' === typeof example.requests[index] ? null : specSchema.validateAndParseSchema(example.requests[index])
            };

            specPairs.push(specPair);
        };

        example.responses.forEach(makePair);

        return {
            parsedUrl: parsedUrl,
            execute: getResponseHandler(specPairs)
        };
    });

    return routeHandlers;
};
