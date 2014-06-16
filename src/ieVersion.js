/**
 *
 * Returns the version of Internet Explorer
 * or undefined if no Internet Explorer detected
 * Tested in IE8 ... IE11
 *
 * http://stackoverflow.com/a/20815285/3071651
 *
 */
define("ieVersion", [], function () {
    "use strict";
    return function () {
        var iev,
            ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent)),
            trident = !!navigator.userAgent.match(/Trident\/7.0/),
            rv = navigator.userAgent.indexOf("rv:11.0");

        if (ieold) { iev =  Number(RegExp.$1); }
        if (navigator.appVersion.indexOf("MSIE 10") !== -1) { iev = 10; }
        if (trident && rv !== -1) { iev = 11; }

        return iev;
    };
});
