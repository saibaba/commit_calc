module.exports = function () {

    var debug = false;

    function log(msg) {
        if (debug) console.log(msg);
    }

    var stdTable = {
        maxCommitAmount : 200000.00,
        minCommitAmount : 500.00,

        termTiers : { 
                0: [
                      { 'max' : 5000, 'percent' : 0 }, 
                      { 'max' : 5000, 'percent' : 4 }, 
                      { 'max' : 15000, 'percent' : 8},
                      { 'max' : 25000, 'percent' : 12},
                      { 'max' : 50000, 'percent' : 16},
                      { 'max' : 100000, 'percent' : 20},
                      { 'max' : 100001, 'percent' : 'call'}
                ],
                6: [
                      { 'max' : 5000, 'percent' : 5 }, 
                      { 'max' : 5000, 'percent' : 9 }, 
                      { 'max' : 15000, 'percent' : 13},
                      { 'max' : 25000, 'percent' : 17},
                      { 'max' : 50000, 'percent' : 21},
                      { 'max' : 100000, 'percent' : 25},
                      { 'max' : 100001, 'percent' : 'call'}
                ],
                 12: [
                      { 'max' : 5000, 'percent' : 10 }, 
                      { 'max' : 5000, 'percent' : 14 }, 
                      { 'max' : 15000, 'percent' : 18},
                      { 'max' : 25000, 'percent' : 22},
                      { 'max' : 50000, 'percent' : 26},
                      { 'max' : 100000, 'percent' : 30},
                      { 'max' : 100001, 'percent' : 'call'}
                ],
                 18: [
                      { 'max' : 5000, 'percent' : 16 }, 
                      { 'max' : 5000, 'percent' : 20 }, 
                      { 'max' : 15000, 'percent' : 24},
                      { 'max' : 25000, 'percent' : 28},
                      { 'max' : 50000, 'percent' : 32},
                      { 'max' : 100000, 'percent' : 36},
                      { 'max' : 100001, 'percent' : 'call'}
                ],
                 36: [
                      { 'max' : 5000, 'percent' : 33 }, 
                      { 'max' : 5000, 'percent' : 37 }, 
                      { 'max' : 15000, 'percent' : 41},
                      { 'max' : 25000, 'percent' : 45},
                      { 'max' : 50000, 'percent' : 49},
                      { 'max' : 100000, 'percent' : 53},
                      { 'max' : 100001, 'percent' : 'call'}
                ],                
        }
    };

    var prepayExtra = 2;

       function upTable(extra)   {
           var ntbl = {};
           ntbl.minCommitAmount = stdTable.minCommitAmount;
           ntbl.maxCommitAmount = stdTable.maxCommitAmount;

           var tiers = stdTable.termTiers;
           var p, m, i, termDiscounts;

           ntbl.termTiers = {};
           var ntiers = ntbl.termTiers;

           for (p in tiers) {
               if (tiers.hasOwnProperty(p)) {
                   if (p == 0) { continue; }  // prepay Ondemand is not allowed

                   termDiscounts = tiers[p];
                   ntiers[p] = Array();
                   for (i = 0; i < termDiscounts.length; i++) {
                       ntiers[p][i] = { max : termDiscounts[i].max, percent: termDiscounts[i].percent +  extra };
                   }
               }
           }

           return ntbl;
       }

    var prepayTable = upTable(prepayExtra);

    function tierDiscount(curamt, maxamt, percent) {
        var amt_to_use = 0;
        var remaining = 0;
        if (curamt > maxamt) {
            amt_to_use = maxamt;
            remaining = curamt - maxamt;
        } else {
            amt_to_use = curamt;
            remaining = 0; 
        }

        var discount = amt_to_use * percent / 100.0;

        return { 'discount' : discount, 'remaining' : remaining};
    }


    function calcTieredDiscount_internal(camt, cterm, table) {

        if (camt > table.maxCommitAmount || camt < table.minCommitAmount) {
            return 0;
        }
        var total = 0;
        var tier = null;


        tier = table.termTiers[cterm];

        var amt = camt;
        var tier_id = 0;
        var tier_amount;
        var td = null;
        var tmax = 0;
        var tpercent = 0;

        while (amt > 0) {
            tmax = tier[tier_id]['max'];
            tpercent = tier[tier_id]['percent'];
            if (typeof(tpercent) == "string") {
                total =  "CALL";
                break;
            }
            td =  tierDiscount(amt, tmax, tpercent);
            total += td['discount'];
            amt = td['remaining'];
            tier_id += 1;
        }

        return total;
    }

    function calcTieredDiscount(amount, term, isPrepay) {

        log("calcTieredDiscount with amt = " + amount + " and term = " + term + " and prepayflag = " + isPrepay);
        if (isPrepay) return calcTieredDiscount_internal(amount, term, prepayTable);
        else return calcTieredDiscount_internal(amount, term, stdTable);
    }

    function calcDiscount(amount, term, prepayFlag) {
  
        var rv = { amount : amount, term: term, prepayFlag: prepayFlag};
        var discount = 0;
        var discountPercent = 0;

        if (amount != 0) {

            if (prepayFlag && term == 0)return { "message" : "There is no prepay option for on-demand commit discounts" }; 
            if (prepayFlag && (!(term in prepayTable.termTiers))) return { "message" : "There is no discount for months in prepay model : " + term };
            if ((!prepayFlag) && (!(term in stdTable.termTiers))) return { "message" : "There is no discount for months in standard model : " + term };
            discount = calcTieredDiscount(amount, term, prepayFlag);
            discount = roundNumber(discount);
            discountPercent = 0;
            discountPercent = roundNumber(discount * 100 / amount);
            rv['discount'] = roundNumber((discountPercent * amount)/100);
            rv['percent'] = discountPercent;
        } else {
            rv['discount'] = 0;
            rv['percent'] = 0;
        }
   
        var monthlyCharges = amount - rv['discount'];

        if (prepayFlag) {
            rv['prepayCharges'] = term * monthlyCharges;
            rv['monthlyCharges'] = 0;
        } else {
            rv['prepayCharges'] = 0
            rv['monthlyCharges'] = monthlyCharges;
        }
        return rv;
    }

    function calcCancelFee(amount, term, prepayFlag, monthsCompleted, amountsAvailed) {

        var d = calcDiscount(amount, term, prepayFlag);
        var percent = d.percent;
 
        var total_paid  = 0;

        if (prepayFlag) { total_paid  = d.prepayCharges; }
        else { total_paid = d.monthlyCharges * monthsCompleted; }

        var total_avail = 0;
        var total_loss = 0;
        var total_disc  = 0;
        var ds = [];
        for (var n = 0; n < monthsCompleted; n++) {
            var amt_avail = amountsAvailed[n];
            var amt_disc = roundNumber((amt_avail * percent) / 100.00);
            var amt_loss = amount - amt_avail;
            total_avail += amt_avail;
            total_loss += amt_loss;
            total_disc += amt_disc;
            ds.push(amt_disc);
        }

        total_avail = roundNumber(total_avail);
        total_disc = roundNumber(total_disc);
        total_loss = roundNumber(total_loss);

        log(ds);
        var rem_months = term - monthsCompleted;
        if (prepayFlag)  {
            var mc = amount; // - d.discount;
            total_loss += rem_months * mc;
        }
        var rem_commit = 0;

        if ( (term != 0) && (!prepayFlag))  rem_commit = amount * rem_months;

        log("total disc = " + total_disc + " ; total loss = " + total_loss + "; rem commtment = " + rem_commit);

        var fee = 0;

        if (term != 0) {
            if (total_loss >= total_disc) {
                fee = 0.0;
            } else {
                fee  = Math.min(total_disc, rem_commit);
            }
        }

        return {prepay: prepayFlag, commit: amount, term: term, percent: percent,  months: monthsCompleted, avails: amountsAvailed, discounts:ds, totalAvailed: total_avail, totalDisc : total_disc, totalLoss : total_loss, totalPaid: total_paid, remCommit: rem_commit, cancelFee: fee};
    }

    function roundNumber(number) { // Arguments: number to round as per commit discount rules

        var roundingFactor = 100;
        var result = Math.round(number * roundingFactor)/roundingFactor;
        log("before = " + number + " and after " + result);
        return result;
    }

    var holder = {

        debug : function(flag)  { debug = flag; },
        round : roundNumber,
        getTable : function(prepayFlag) { 
            if (prepayFlag) return prepayTable;
            else return stdTable;
        },
        getDiscount: calcDiscount,
        getCancelFee: calcCancelFee,
    };

    return holder;

}
