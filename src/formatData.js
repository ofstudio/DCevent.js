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
define("formatData", [], function () {
    "use strict";

    return function (data) {
        var result = "",
            s = [],
            i = data.length;

        while (i--) {
            s.unshift(data[i].lastName + " " + data[i].firstName);
            if (data[i].city) { s[0] = s[0] + ", " + data[i].city; }
            if (data[i].parnterLastName || data[i].parnterFirstName) {
                s[0] = s[0] + " – " + data[i].parnterLastName + " " + data[i].parnterFirstName;
                /**
                 * @class
                 * @property partnerCity
                 */
                if (data[i].partnerCity) { s[0] = s[0] + ", " + data[i].partnerCity; }
            }
        }

        if (s.length) {
            result = "<ol>\n" + "<li>" + s.join("</li>\n<li>") + "</li>" + "\n</ol>";
        }
        return result;
    };
});
