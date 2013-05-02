var express=require('express');
var cc = require('./commit');

var app = express();

var log = console.log

function error(err, req, res, next) {
    console.log(err);
}



var CommitCalculator = cc();

CommitCalculator.debug ( true);

function determinePrepay(req, res, next) {

    var t = req.query.prepay;
    if (t) {
        t = (/^true$/i).test(t);
    } else {
        t = false;
    }

    req.prepayFlag = t;
    next();
}

function getTable(req, res, next) {
    res.json(200, CommitCalculator.getTable(req.prepayFlag));
}

function is_positive_numeric(val){
    return val && /^\d+(\.\d+)?$/.test(val + '');
}

function is_positive_integer(val) {
    return val && /^\d+$/.test(val + '');
}

function getDiscount(req, res, next) {

    if (!is_positive_numeric(req.query.amount)) {
        res.send(400, "Invalid amount");
    } else if (!is_positive_integer(req.query.term)) {
        res.send(400, "Invalid term");
    } else {
        var amount = parseFloat(req.query.amount);
        var term = parseInt(req.query.term);
        var d = CommitCalculator.getDiscount(amount, term, req.prepayFlag);
        res.json(200, d); 
    }
}

function repeat(v, times) {
    var a = Array();
    for (var i = 0; i<times; i++) {
        a.push(v);
    }
    return a;
}

function getCancelFee(req, res, next) {

    log(req.query);
    if (!is_positive_numeric(req.query.amount)) {
        res.send(400, "Invalid amount");
        return;
    } else if (!is_positive_integer(req.query.term)) {
        res.send(400, "Invalid term");
        return;
    } else if (!is_positive_integer(req.query.months)) {
        res.send(400, "Invalid months");
        return;
    }

    var amount = parseFloat(req.query.amount);
    var term = parseInt(req.query.term);
    var months = parseInt(req.query.months);
    var avails = req.query.avails;

    if (months>term) { months = term; }
    var a = [];
    var i, avail_amt;

    if (avails) {

        if (! (avails instanceof Array)) {
            avails = [avails];
        }
        var c = Math.min(avails.length, months);
        for (i = 0; i < c; i++) {
            if (!is_positive_numeric(avails[i])) {
                res.send(400, "Invalid availed amount");
                return;
            }
            avail_amt = parseFloat(avails[i]);
            if (avail_amt > amount) {
                res.send(400, "Invalid availed amount - cannot be greater than commit amount");
                return;
            }
  
            a.push(avail_amt);
        }
        c = months - c;
        for (i = 0;  i < c; i++) { a.push(amount); }
    } else {
        a  = repeat(amount, months);
    }

    var d = CommitCalculator.getCancelFee(amount, term, req.prepayFlag, months, a);
    res.json(200, d); 
}

app.use(error);
app.use('/ui', express.static(__dirname + '/static/'));
app.use(express.logger());

app.get('/cd/table', determinePrepay, getTable);
app.get('/cd/discount', determinePrepay, getDiscount);
app.get('/cd/cancelfee', determinePrepay, getCancelFee);

app.listen(8100);

log("Listening on port 8100...");
