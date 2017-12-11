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
define("dcApi", ["defer", "loadJson"],
    function (defer, loadJSON) {
        "use strict";
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
                var d = defer(),
                    url = apiBaseUrl + "eventinfo/" + id.toString() + "/contests" + lang;
                loadJSON(url,
                    function (data) {
                        var contests = {}, i = data.length;
                        while (i--) {
                            contests[data[i].id] = contests[data[i].name] =  data[i];
                        }
                        d.resolve(contests);
                    },
                    function (data) {
                        d.reject("Unable to load contests list!\nFailed to load " + url + "\n" + data);
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

                if (requests.eventContests === undefined) { requests.eventContests = requestEventContests(); }

                requests.eventContests.done(function (contests) {
                    if (contests[contest] === undefined) {
                        d.reject("No such contest: " + contest);
                        return;
                    }

                    var url = apiBaseUrl + "eventinfo/signups/" + contests[contest].id + "/" + select + lang;
                    loadJSON(url,
                        function (data) {
                            var partner,
                                i = data.length;
                            while (i--) {
                                /**
                                 * @class
                                 * @property cityAndState
                                 * @property partnerName
                                 */
                                data[i].city = data[i].cityAndState;
                                if (data[i].partnerName) {
                                    //удалить двойные пробелы сначала
                                    partner = data[i].partnerName.replace(/ +(?= )/g, '').split(" ");
                                    data[i].parnterFirstName = partner[0];
                                    data[i].parnterLastName = partner[1] || "";
                                }
                            }
                            d.resolve(data);
                        },
                        function (data) {
                            d.reject("Unable to load contest signups!\nFailed to load " + url + "\n" + data);
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
                var d = defer(),
                    url = apiBaseUrl + "eventinfo/" + id.toString() + "/signups" + lang;

                loadJSON(url,
                    function (data) {
                        var names,
                            i = data.length;
                        while (i--) {
                            /**
                             * @class
                             * @property participantName
                             * @property partnerCity
                             */
                            //удалить двойные пробелы сначала
                            names = data[i].participantName.replace(/ +(?= )/g, '').split(" ");
                            data[i].firstName = names[0];
                            data[i].lastName = names[1] || "";
                            data[i].city = data[i].cityAndState;
                        }
                        d.resolve(data);
                    },
                    function (data) {
                        d.reject("Unable to load event signups!\nFailed to load " + url + "\n" + data);
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
                        if (typeof callback === "function") { callback(data); }
                    });
                    requests.contestSignups[contest][select].fail(function (data) {
                        throw new Error("API Error: can't get contest signups!\n " + data);
                    });
                },

                getEventSignups: function (callback) {
                    if (requests.eventSignups === undefined) { requests.eventSignups = requestEventSignups(); }
                    requests.eventSignups.done(function (data) {
                        if (typeof callback === "function") { callback(data); }
                    });
                    requests.eventSignups.fail(function (data) {
                        throw new Error("API Error: can't get event signups!\n" + data);
                    });
                }
            };
        };
    });
