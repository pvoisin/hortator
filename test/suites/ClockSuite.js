var expect = require("expect.js");
var spy = require("sinon").spy;

var EventEmitter = require("events").EventEmitter;
var Clock = require("../../source/Clock");


describe("Clock", function() {
	it("should work properly", function(proceed) {
		// 10 ms only seems to be a bit optimistic for drifting not to happen...
		var period = 0.02;
		var clock = new Clock({period: period});

		expect(clock instanceof EventEmitter).to.be(true);
		var beginning = new Date();
		var tickTimes = [];
		var observers = {
			"A": spy(),
			"B": spy(function(tickTime) {
				tickTimes.push(tickTime);
			}),
			"C": spy()
		};

		clock.on("test", observers["A"]);
		clock.on("test", observers["C"]);

		clock.emit("test", "ABC", 123);

		expect(observers["A"].calledWith("ABC", 123)).to.be(true);
		expect(observers["C"].calledWith("ABC", 123)).to.be(true);

		for(var key in observers) {
			observers[key].reset();
		}

		clock.on("start", observers["A"]);
		clock.on("tick", observers["A"]);
		clock.on("tick", observers["B"]);
		clock.on("tick", observers["C"]);
		clock.on("stop", observers["C"]);

		var duration = 5;
		// +1 for the first "tick" event which occurs right after the "start" event
		var totalTickCount = Math.floor(duration / clock.period) + 1;
		var halfDuration = duration / 2;
		// +1 for the first "tick" event which occurs right after the "start" event
		var halfTickCount = Math.floor(halfDuration / clock.period) + 1;

		clock.start();

		// Remove observer "A" at half the duration:
		setTimeout(function() {
			clock.removeListener("start", observers["A"]);
			clock.removeListener("tick", observers["A"]);
			clock.removeListener("test", observers["A"]);
		}, (halfDuration + clock.period / 2) * 1000);

		setTimeout(function() {
			clock.stop();

			// +1 for the "start" event
			expect(observers["A"].callCount).to.equal(halfTickCount + 1);

			expect(observers["B"].callCount).to.equal(totalTickCount);

			// +1 for the "stop" event
			expect(observers["C"].callCount).to.equal(totalTickCount + 1);

			// Verify it is well paced (here we expect no drifting so maybe the period shall b updated if too optimistic)
			tickTimes.forEach(function(tickTime, index) {
				var lowLimit = beginning.getTime() + index * period * 1000;
				var highLimit = lowLimit + period * 1000;
//console.log([lowLimit, highLimit], tickTime.getTime());
				expect(tickTime.getTime()).to.be.aboveOrEqual(lowLimit);
				expect(tickTime.getTime()).to.be.below(highLimit);
			});

			proceed();
		}, (duration + clock.period / 2) * 1000);

		this.timeout((duration + 1) * 1000);
	});

	it.only("should catch up if it got delayed", function(proceed) {
		var period = 0.01;
		var clock = new Clock({period: period});

		var observers = {
			"A": spy(function() { console.log("A", Date.now()); }),
			"B": spy(/*function() { console.log("B"); }*/)
		};

		clock.on("tick", observers["A"]);

		var beginning = new Date();
		var blockingDelay = 1;

		clock.once("tick", function() {
			process.nextTick(function() {
console.log(Date.now());
				setTimeout(function() {
console.log(Date.now());
					expect(observers["A"].callCount).to.be(2);
					expect(observers["B"].callCount).to.be(2);

					proceed();
				}, period * 1000);

				var elapsedTime = new Date() - beginning;
				expect(elapsedTime > blockingDelay * 1000).to.be(true);
				expect(elapsedTime < (blockingDelay + period) * 1000).to.be(true);
				expect(observers["A"].callCount).to.be(1);
				expect(observers["B"].callCount).to.be(1);
			});

			var before = Date.now();
			block(blockingDelay);

			console.log((Date.now() - before) / (period * 1000));
		});

		clock.on("tick", observers["B"]);

		clock.start();
	});
});

function block(delay) {
	var threshold = new Date().getTime() + (delay * 1000);

	while(new Date().getTime() <= threshold);
}

expect.Assertion.prototype.aboveOrEqual = function(n) {
    this.assert(
        this.obj >= n
      , function(){ return "expected " + expect.stringify(this.obj) + " to be above or equal " + n }
      , function(){ return "expected " + expect.stringify(this.obj) + " to be below " + n });
    return this;
};
/*
expect.Assertion.prototype.belowOrEqual = function(n) {
    this.assert(
        this.obj <= n
      , function(){ return "expected " + expect.stringify(this.obj) + " to be below or equal " + n }
      , function(){ return "expected " + expect.stringify(this.obj) + " to be above " + n });
    return this;
};
//*/