/**
 @module index.js
 @author mtarkiai
 @since 2/27/15
 */

var url         = require('url'),
    request     = require('request'),
    eventstream = require('event-stream');

module.exports = function(jflo) {
    jflo.flow("http", function(config) {
            var params = config.params || {};
            var url_param = (params._ || [])[0] || params.url;
            if (!url_param) {
                throw new Error("Cannot CURL without an URL");
            }
            var method = config.params.x || 'get';
            if (params.debug) {
                config.logger.debug.write({method: method, url: url});
            }
            var pipeline = eventstream.pipeline(
                jflo.formatters.ndjson(),
                request({
                    method: method,
                    uri: url_param,
                    headers: {
                        "Content-Type": "application/x-ndjson",
                        "Connection": "keep-alive",
                        "Transfer-Encoding": "chunked"
                    },
                    qs: params.q
                })
                    .on('error', function(err, resp, body) {
                        config.logger.error.write(err);
                    })
                    .on('response', function(response) {
                        if (params.debug) {
                            config.logger.debug.write({response: {statusCode: response.statusCode}});
                        }
                    }),
                jflo.parsers.ndjson()
            );

            return pipeline;
        },
        {
            info: {
                project: "Http",
                title: "Streaming http client",
                params: {
                    url: "HTTP URL",
                    x: "HTTP method",
                    h: {
                        "{name}": "Sets the header {name}"
                    },
                    q: {
                        "{name}": "Sets the query parameter {name}"
                    },
                    debug: "Generates debug information"
                }
            },
            configs: {
                $default: {
                    x: "get"
                }
            }
        })
}