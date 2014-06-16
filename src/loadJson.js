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
define("loadJson", ["ieVersion"], function (ieVersion) {
    "use strict";

    return function (url, successHandler, errorHandler) {
        var req,
            ieVer = ieVersion(),
            raiseError = function (msg) {
                if (typeof errorHandler === "function") {
                    errorHandler(msg);
                } else {
                    throw new Error("loadJSON: " + msg);
                }
            },
            raiseSuccess = function (data) {
                if (typeof successHandler === "function") {
                    successHandler(data);
                }
            };

        if (ieVer && ieVer < 10) {
            // If MSIE 8 or 9 later
            req = new window.XDomainRequest();
            req.onerror = function () {
                raiseError("XDomainRequest error");
            };
            req.onload = function () {
                raiseSuccess(window.JSON.parse(req.responseText));
            };

            req.open("GET", url);
            req.send();

        } else {
            // If not MSIE
            if (window.XMLHttpRequest !== undefined) {
                req = new window.XMLHttpRequest();
                req.open('GET', url, true);
                req.onreadystatechange = function () {
                    if (req.readyState === 4) { // `DONE`
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
                raiseError("No appropriate method for cross-domain request!");
            }
        }
    };
});
