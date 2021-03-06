/**
 * A simple workaround on Deferred / Promise pattern
 * with result caching and multiply actions on success / fail / always
 *
 * defer() returns methods:
 *      resolve(data) - request is successfully resolved (returns nothing)
 *      reject(msg) - request if failed (returns nothing)
 *      promise() - returns promise
 *
 * promise() returns methods:
 *      done(successfulCallback) - add on successful callback (returns promise)
 *      fail(failCallback) - add on fail callback (returns promise)
 *      always(alwaysCallback) - add always callback (returns promise)
 *
 * Example:
 *
 * function someHeavyRequest(url) {
 *     var d = defer();
 *     doHeavyRequest(url,
 *         function (data) {
 *             // on success
 *             // ...do something
 *             d.resolve(data);
 *         },
 *         function (data) {
 *             // on fail
 *             // ...do something
 *             d.reject(data);
 *         });
 *     return d.promise();
 * }
 *
 * var req = someHeavyRequest("http://some.url/of/request/");
 *
 * req.done(function (data) {
 *     console.log("We got it!");
 *     console.log(data);
 * });
 *
 * req.done(function (data) {
 *     console.log("We got it again without new request!");
 *     console.log(data);
 * });
 *
 * req.fail(function (data) {
 *     console.error("Something wrong");
 *     console.error(data);
 * });
 *
 * req.always(function (data) {
 *     console.log("Whatever happens...");
 *     console.log(data);
 * });
 *
 * Thanx to Flambino for code review
 * http://codereview.stackexchange.com/questions/54143/
 *
 * @returns {{promise: promise, resolve: resolve, reject: reject, always: always}}
 */
define("defer", [], function () {
    "use strict";

    return function () {
        var currentState = 'pending',
            callbacks    = { resolved: [], rejected: [], always: [] },
            args         = [],
            promise;

        function execute(state) {
            var cb;
            while (callbacks[state].length) {
                cb = callbacks[state].shift();
                if (typeof cb === 'function') {
                    cb.apply(cb, args);
                }
            }
        }

        // generic function factory for done/fail functions
        function handle(state) {
            return function (cb) {
                callbacks[state].push(cb);
                if (currentState !== 'pending') {
                    if (currentState === state) { execute(state); }
                    if (state === 'always') { execute('always'); }
                }
                return promise();
            };
        }

        // promise function
        promise = function () {
            return {
                done: handle('resolved'),
                fail: handle('rejected'),
                always: handle('always')
            };
        };

        // generic function factory for resolve/reject functions
        function complete(state) {
            return function () {
                if (currentState !== 'pending') { return; }
                args = Array.prototype.slice.call(arguments, 0);
                currentState = state;
                execute(state);
                execute('always');
            };
        }

        return {
            promise: promise,
            resolve: complete('resolved'),
            reject:  complete('rejected')
        };
    };
});
