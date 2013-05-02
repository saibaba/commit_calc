
function repeat(v, times) {
	var a = Array();
	for (var i = 0; i<times; i++) {
		a.push(v);
	}
	return a;
}
test( "Commit Discounts", function() {

  CommitCalculator.debug(true);
  var std = window.CommitCalculator.getTable(false);

  ok(std != null, "Standard Table is present");
  ok( std.termTiers.hasOwnProperty(0), "Standard table has ondemand tier" );

  var prepay = window.CommitCalculator.getTable(true);
  ok(prepay != null, "Prepay table is present");
  ok( ! prepay.termTiers.hasOwnProperty(0), "Prepay table does not have on-demand tier");

  var d = CommitCalculator.getDiscount(10, 6, false);
  ok(d.amount == 0 && d.percent == 0, "Test 1 - 10/6mo/monthly - 0 dscount")

  d = CommitCalculator.getDiscount(10, 6, true);
  ok(d.amount == 0 && d.percent == 0, "Test 2 - 10/6mo/prepay - 0 discount")

  d = CommitCalculator.getDiscount(20000, 6, false);
  ok(d.amount == 2000 && d.percent == 10, "Test 3 - 20K/6mo/monthly - 2K/10% discount")

  d = CommitCalculator.getDiscount(20000, 6, true);
  ok(d.amount == 2400 && d.percent == 12, "Test 4 - 20K/6mo/prepay - 2400/12% discount")

  f = CommitCalculator.getCancelFee(20000, 0, false, 2, 40000);
  ok(f.cancelFee == 0, "Test 5 - 20K/ondemand/monthly/40K availed - 0 fee");
  
  f = CommitCalculator.getCancelFee(20000, 6, true, 2, [10000,15000]);
  ok(f.cancelFee == 0, "Test 6 - 20K/6mo/prepay/25K availed - 0 fee");

  f = CommitCalculator.getCancelFee(35000, 36, false, 33, repeat(35000,33));
  ok(f.cancelFee == 105000, "Test 7 - 35K/36mo/monthly/1155K availed - 105000 fee");

  f = CommitCalculator.getCancelFee(35000, 36, true, 33, [
  	15000,
  	35000,
  	35000,
  	0,
  	25000,
  	35000,
  	0,
  	5000,
  	35000,
  	3000,
  	7000,
  	5000,
  	0,0,
  	0,0,
    35000, 2, 300, 3500, 13000, 35000, 3, 0,0,0,0,0,
    17000, 35000, 0, 3500, 35000, 0,0,0]);
  ok(f.cancelFee == 0 && f.totalDisc == 160090.51 && f.totalLoss == 777695 && f.remCommit === 105000, "Test8");
});