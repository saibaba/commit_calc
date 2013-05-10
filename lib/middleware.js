var express = require("express");
var log  = require("./log");

exports.javascriptParser = function(req, res, next) {

    var data='';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
        data += chunk;
    });

    req.on('end', function() {
        req.rawBody = data;
        next();
    });
}

exports.authenticator = function(req, res, next) {
    req.tenant = "demo"; 
    log("tenant set to " + req.tenant);
     next();
}


exports.HeaderChecker = function(header, value) {
    return function(req, res, next) {
        if (req.get(header) != value) { 
            next("Unsupported " + header + " header: required " + value + " but got " + req.get(header));
        } else {
           next();
        }
    }
}
