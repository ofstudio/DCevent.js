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
 * Copyright (c) 2014 Oleg Fomin <ofstudio@gmail.com>
 * Released under the MIT license
 *
 * @author Oleg Fomin <ofstudio@gmail.com>
 * @version 0.0.1
 */
define(["dcApi", "formatData"], function (dcApi, formatData) {
    "use strict";

    var id,
        contest,
        select,
        eventsApi = {},
        apiBaseUrl = "https://danceconvention.net/eventdirector/rest/",
        apiUrlContainer = document.querySelector("script[data-dcevent-api]"),
        containers = document.querySelectorAll("[data-dcevent]"),
        i = containers.length,
        output = function (container) {
            return function (data) {
                container.innerHTML = formatData(data);
            };
        };

    if (apiUrlContainer) { apiBaseUrl = apiUrlContainer.getAttribute("data-dcevent-api"); }

    while (i--) {
        id = containers[i].getAttribute("data-dcevent");
        if (id) {
            contest = containers[i].getAttribute("data-contest");
            select = containers[i].getAttribute("data-select");

            if (!eventsApi[id]) { eventsApi[id] = dcApi(id, apiBaseUrl); }

            if (contest && select) { // contest signups case
                eventsApi[id].getContestSignups(contest, select, output(containers[i]));
            }

            if (!contest && select === "signups") { // event signups case
                eventsApi[id].getEventSignups(output(containers[i]));
            }
        }
    }

    window.DCevent = {
        api: function (id, url) {
            if (url === undefined) { url = apiBaseUrl; }
            return dcApi(id, url);
        },
        version: "0.0.1",
        apiBaseUrl: apiBaseUrl
    };

});
