var log = require("./log");
var config = require("./config");


exports.HeaderChecker = function(header, value) {
    return function(req, res, next) {
        if (req.get(header) != value) { 
            next("Unsupported " + header + " header: required " + value + " but got " + req.get(header));
        } else {
           next();
        }
    }
}

exports.ObjStore = function(tenant) {

    return function(req, res, next) {

        var MongoClient = require('mongodb').MongoClient;
        MongoClient.connect(config.mongoUrl + tenant , function(err, db) {
            if(!err) {
                log("We are connected");
                var store = {
                    db : db,
                    close: function() { this.db.close(); },
                    objects: function(objtype, objs_cb) {
                        this.db.collection(objtype, function (err, collection) {
                            objs_cb(err, collection);
                        });
                    }
                };
                req.store = store;
                next();
            } else {
                log("We are not connected");
                next(err);
            }
        });
    };
};
