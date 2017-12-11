;(function() {
var defer, ieVersion, loadJson, dcApi, formatData, dcevent;
(function (window, document, undefined) {
    'use strict';
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
    defer = function () {
        var currentState = 'pending', callbacks = {
                resolved: [],
                rejected: [],
                always: []
            }, args = [], promise;
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
                    if (currentState === state) {
                        execute(state);
                    }
                    if (state === 'always') {
                        execute('always');
                    }
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
                if (currentState !== 'pending') {
                    return;
                }
                args = Array.prototype.slice.call(arguments, 0);
                currentState = state;
                execute(state);
                execute('always');
            };
        }
        return {
            promise: promise,
            resolve: complete('resolved'),
            reject: complete('rejected')
        };
    };
    /**
     *
     * Returns the version of Internet Explorer
     * or undefined if no Internet Explorer detected
     * Tested in IE8 ... IE11
     *
     * http://stackoverflow.com/a/20815285/3071651
     *
     */
    ieVersion = function () {
        var iev, ieold = /MSIE (\d+\.\d+);/.test(navigator.userAgent), trident = !!navigator.userAgent.match(/Trident\/7.0/), rv = navigator.userAgent.indexOf('rv:11.0');
        if (ieold) {
            iev = Number(RegExp.$1);
        }
        if (navigator.appVersion.indexOf('MSIE 10') !== -1) {
            iev = 10;
        }
        if (trident && rv !== -1) {
            iev = 11;
        }
        return iev;
    };
    /**
     * Crossbrowser AJAX request
     *
     * Browser compatibility:
     *      Internet Explorer 8 and up (with URL scheme issues in IE)
     *
     *  Issues:
     *
     *  Internet Explorer URL scheme issues of script origin and requested domain (http <=> https)
     *      IE8 / Win XP:
     *          XDomainRequest cross-domain same scheme - OK
     *          XDomainRequest cross-domain diff scheme - ERROR Access is denied.
     *          XMLHttpRequest cross-domain same scheme - ERROR Access is denied.
     *          XMLHttpRequest cross-domain diff scheme - ERROR Access is denied.
     *
     *      IE9 / Win 7:
     *          XDomainRequest cross-domain same scheme - OK
     *          XDomainRequest cross-domain diff scheme - ERROR Access is denied.
     *          XMLHttpRequest cross-domain same scheme - ERROR Access is denied.
     *          XMLHttpRequest cross-domain diff scheme - ERROR Access is denied.
     *
     *      IE10 / Win 8:
     *          XDomainRequest cross-domain same scheme - OK
     *          XDomainRequest cross-domain diff scheme - ERROR Access is denied.
     *          XMLHttpRequest cross-domain same scheme - OK, with notification in console (SEC7118)
     *          XMLHttpRequest cross-domain diff scheme - OK, with notification in console (SEC7118)
     *
     *      IE11 / Win 8:
     *          XDomainRequest cross-domain same scheme - XDomainRequest is undefined
     *          XDomainRequest cross-domain diff scheme - XDomainRequest is undefined
     *          XMLHttpRequest cross-domain same scheme - OK, with notification in console (SEC7118)
     *          XMLHttpRequest cross-domain diff scheme - OK, with notification in console (SEC7118)
     *
     * Strategy:
     *
     *      If browser === IE and IE < 10
     *          try to use XDomainRequest
     *      else
     *          use XMLHttpRequest
     *
     * @author Oleg Fomin <ofstudio@gmail.com>
     * @param url
     * @param successHandler
     * @param errorHandler
     */
    loadJson = function (url, successHandler, errorHandler) {
        var req, ieVer = ieVersion(), raiseError = function (msg) {
                if (typeof errorHandler === 'function') {
                    errorHandler(msg);
                } else {
                    throw new Error('loadJSON: ' + msg);
                }
            }, raiseSuccess = function (data) {
                if (typeof successHandler === 'function') {
                    successHandler(data);
                }
            };
        if (ieVer && ieVer < 10) {
            // If MSIE 8 or 9 later
            req = new window.XDomainRequest();
            req.onerror = function () {
                raiseError('XDomainRequest error');
            };
            req.onload = function () {
                raiseSuccess(window.JSON.parse(req.responseText));
            };
            req.open('GET', url);
            req.send();
        } else {
            // If not MSIE
            if (window.XMLHttpRequest !== undefined) {
                req = new window.XMLHttpRequest();
                req.open('GET', url, true);
                req.onreadystatechange = function () {
                    if (req.readyState === 4) {
                        // `DONE`
                        if (req.status === 200) {
                            raiseSuccess(window.JSON.parse(req.responseText));
                        } else {
                            raiseError(req.status);
                        }
                    }
                };
                req.send();
            } else {
                // No XDomainRequest support and no XMLHttpRequest support
                raiseError('No appropriate method for cross-domain request!');
            }
        }
    };
    /**
     * danceconvention.net single event API implementation
     *
     * Usage:
     *
     * dcApi(eventId, apiBaseUrl)
     *
     * Arguments:
     *
     * eventId - (String) ID of event
     * apiBaseUrl - (String) URL of danceconvention.net API
     * lang - (String) (optional) language code
     *
     * Requires:
     *      defer function
     *      loadJSON function
     *
     * Returns methods:
     *      getContestSignups(contest, select, callback) - single contest signups
     *      getEventSignups(callback) - all event signups
     *
     * Example:
     *
     *      var api = dcApi ("67590", "https://danceconvention.net/eventdirector/rest/eventinfo/");
     *      api.getEventSignups(function (data) {
     *          console.log(data);
     *      });
     *      api.getContestSignups("Novice Jack n' Jill,", "leaders", function (data) {
     *          console.log(data)
     *      });
     *
     * @author Oleg Fomin <ofstudio@gmail.com>
     * @param id
     * @param apiBaseUrl
     * @returns {{getContestSignups: getContestSignups, getEventSignups: getEventSignups}}
     */
    dcApi = function (defer, loadJSON) {
        'use strict';
        return function (id, apiBaseUrl, lang) {
            var requests, requestEventContests, requestContestSignups, requestEventSignups;
            lang = lang ? '?lang=' + lang : '';
            requests = {
                contestSignups: {},
                eventSignups: undefined,
                eventContests: undefined
            };
            /**
             * Promise request list of contests of the event
             *
             * @returns Promise Object
             */
            requestEventContests = function () {
                var d = defer(), url = apiBaseUrl + 'eventinfo/' + id.toString() + '/contests' + lang;
                loadJSON(url, function (data) {
                    var contests = {}, i = data.length;
                    while (i--) {
                        contests[data[i].id] = contests[data[i].name] = data[i];
                    }
                    d.resolve(contests);
                }, function (data) {
                    d.reject('Unable to load contests list!\nFailed to load ' + url + '\n' + data);
                });
                return d.promise();
            };
            /**
             * Promise request single contest signups
             *
             * @param contest
             * @param select
             * @returns Promise Object
             */
            requestContestSignups = function (contest, select) {
                var d = defer();
                if (requests.eventContests === undefined) {
                    requests.eventContests = requestEventContests();
                }
                requests.eventContests.done(function (contests) {
                    if (contests[contest] === undefined) {
                        d.reject('No such contest: ' + contest);
                        return;
                    }
                    var url = apiBaseUrl + 'eventinfo/signups/' + contests[contest].id + '/' + select + lang;
                    loadJSON(url, function (data) {
                        var partner, i = data.length;
                        while (i--) {
                            /**
                             * @class
                             * @property cityAndState
                             * @property partnerName
                             */
                            data[i].city = data[i].cityAndState;
                            if (data[i].partnerName) {
                                //удалить двойные пробелы сначала
                                partner = data[i].partnerName.replace(/ +(?= )/g, '').split(' ');
                                data[i].parnterFirstName = partner[0];
                                data[i].parnterLastName = partner[1] || '';
                            }
                        }
                        d.resolve(data);
                    }, function (data) {
                        d.reject('Unable to load contest signups!\nFailed to load ' + url + '\n' + data);
                    });
                });
                requests.eventContests.fail(function (data) {
                    d.reject(data);
                });
                return d.promise();
            };
            /**
             * Promise request all event signups
             *
             * @returns Promise Object
             */
            requestEventSignups = function () {
                var d = defer(), url = apiBaseUrl + 'eventinfo/' + id.toString() + '/signups' + lang;
                loadJSON(url, function (data) {
                    var names, i = data.length;
                    while (i--) {
                        /**
                         * @class
                         * @property participantName
                         * @property partnerCity
                         */
                        //удалить двойные пробелы сначала
                        names = data[i].participantName.replace(/ +(?= )/g, '').split(' ');
                        data[i].firstName = names[0];
                        data[i].lastName = names[1] || '';
                        data[i].city = data[i].cityAndState;
                    }
                    d.resolve(data);
                }, function (data) {
                    d.reject('Unable to load event signups!\nFailed to load ' + url + '\n' + data);
                });
                return d.promise();
            };
            // return methods
            return {
                getContestSignups: function (contest, select, callback) {
                    if (requests.contestSignups[contest] === undefined) {
                        requests.contestSignups[contest] = {};
                    }
                    if (requests.contestSignups[contest][select] === undefined) {
                        requests.contestSignups[contest][select] = requestContestSignups(contest, select);
                    }
                    requests.contestSignups[contest][select].done(function (data) {
                        if (typeof callback === 'function') {
                            callback(data);
                        }
                    });
                    requests.contestSignups[contest][select].fail(function (data) {
                        throw new Error('API Error: can\'t get contest signups!\n ' + data);
                    });
                },
                getEventSignups: function (callback) {
                    if (requests.eventSignups === undefined) {
                        requests.eventSignups = requestEventSignups();
                    }
                    requests.eventSignups.done(function (data) {
                        if (typeof callback === 'function') {
                            callback(data);
                        }
                    });
                    requests.eventSignups.fail(function (data) {
                        throw new Error('API Error: can\'t get event signups!\n' + data);
                    });
                }
            };
        };
    }(defer, loadJson);
    /**
     * Data format function
     *
     * Default format:
     *
     *      <ol>
     *          <li>lastName FirstName[, city][ - partnerLastName partnerFirstName[, partnerCity]]</li>
     *          ...
     *          ...
     *      </ol>
     *
     * @param data
     * @returns {string}
     */
    formatData = function (data, formatHook) {
        var result = '', s = [], i = data.length;
        while (i--) {
            s.unshift(data[i].lastName + ' ' + data[i].firstName);
            if (data[i].city) {
                s[0] = s[0] + ', ' + data[i].city;
            }
            if (data[i].parnterLastName || data[i].parnterFirstName) {
                s[0] = s[0] + ' \u2013 ' + data[i].parnterLastName + ' ' + data[i].parnterFirstName;
                /**
                 * @class
                 * @property partnerCity
                 */
                if (data[i].partnerCity) {
                    s[0] = s[0] + ', ' + data[i].partnerCity;
                }
            }
            if (formatHook) {
                s[0] = formatHook(s[0]);
            }
        }
        if (s.length) {
            result = '<ol>\n' + '<li>' + s.join('</li>\n<li>') + '</li>' + '\n</ol>';
        }
        return result;
    };
    /**
     * DCEvent.js - Browser-side implementation of danceconvention.net API
     *
     * http://danceconvention.net
     * https://github.com/danceconvention/dcnet-public
     * Source: https://github.com/ofstudio/DCevent.js
     *
     * Compatibility:
     *
     *  All modern browsers including Internet Explorer 10 and up
     * (Internet Explorer 8 and 9 will work only if your site runs over https
     * due to restrictions in CORS implementation in IE8 and IE9)
     *
     * Copyright (c) 2014-2018 Oleg Fomin <ofstudio@gmail.com>
     * Released under the MIT license
     *
     * @author Oleg Fomin <ofstudio@gmail.com>
     * @version 0.0.3
     */
    dcevent = function (dcApi, formatData) {
        'use strict';
        var id, contest, select, formatHook, formatHookFunc, globalFormatHookContainer = document.querySelector('script[data-format-hook]'), globalFormatHookFunc, eventsApi = {}, apiBaseUrl = 'https://danceconvention.net/eventdirector/rest/', lang = null, langContainer = document.querySelector('script[data-dcevent-lang]'), apiUrlContainer = document.querySelector('script[data-dcevent-api]'), containers = document.querySelectorAll('[data-dcevent]'), i = containers.length, output = function (container, hook) {
                return function (data) {
                    container.innerHTML = formatData(data, hook);
                };
            };
        if (apiUrlContainer) {
            apiBaseUrl = apiUrlContainer.getAttribute('data-dcevent-api');
        }
        if (langContainer) {
            lang = langContainer.getAttribute('data-dcevent-lang');
        }
        if (globalFormatHookContainer) {
            globalFormatHookFunc = eval(globalFormatHookContainer.getAttribute('data-format-hook'));
        }
        while (i--) {
            id = containers[i].getAttribute('data-dcevent');
            if (id) {
                contest = containers[i].getAttribute('data-contest');
                select = containers[i].getAttribute('data-select');
                formatHook = containers[i].getAttribute('data-format-hook');
                if (formatHook) {
                    formatHookFunc = eval(formatHook);
                } else {
                    if (globalFormatHookFunc) {
                        formatHookFunc = globalFormatHookFunc;
                    } else {
                        formatHookFunc = undefined;
                    }
                }
                if (!eventsApi[id]) {
                    eventsApi[id] = dcApi(id, apiBaseUrl, lang);
                }
                if (contest && select) {
                    // contest signups case
                    eventsApi[id].getContestSignups(contest, select, output(containers[i], formatHookFunc));
                }
                if (!contest && select === 'signups') {
                    // event signups case
                    eventsApi[id].getEventSignups(output(containers[i], formatHookFunc));
                }
            }
        }
        window.DCevent = {
            api: function (id, url) {
                if (url === undefined) {
                    url = apiBaseUrl;
                }
                return dcApi(id, url);
            },
            version: '0.0.3',
            apiBaseUrl: apiBaseUrl
        };
    }(dcApi, formatData);
}(window, document));
}());