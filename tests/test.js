/**
 * Created by oleg on 14.06.14.
 */

//define(['defer'], function (defer) {
//
//    var Dobj = function () {
//        this.res = {
//            a: "Result",
//            b: 5
//        };
//
//
//
//        var x = this.def();
//        x.done(function (data) {
//            console.log(data);
//        }).fail(function (data) {
//            console.log('Errr:' + data);
//        }).always(function (data) {
//            console.log("Always " + data);
//        });
//    };
//
//    Dobj.prototype.def = function () {
//        var d = defer();
//        d.reject("Super");
//        return d.promise();
//    };
//
//    var y = new Dobj();
//    //console.log(this);
//});



define(["dcApi"], function (dcApi) {

    var api = dcApi("88070","https://danceconvention.net/eventdirector/rest/");
    api.getEventSignups(function (data) { console.log(data); });

});