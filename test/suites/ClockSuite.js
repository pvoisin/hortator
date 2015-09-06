var expect = require("expect.js");
var spy = require("sinon").spy;

var EventEmitter = require("events").EventEmitter;
var Clock = require("../../source/Clock");


describe("Clock", function() {
	describe("in \"steady\" mode", function() {
		it("should tick at a constant pace", function(proceed) {
			// 10 ms only seems to be a bit optimistic for drifting not to happen...
			var period = 0.025;
			var clock = new Clock({period: period});

			expect(clock instanceof EventEmitter).to.be(true);
			var beginning = Date.now();
			var tickTimes = [];
			var delays = [];
			var tolerance = 0;
			var observers = {
				"A": spy(),
				"B": spy(function(tickTime, delay) {
					tickTimes.push(tickTime);
					if(delay > 2 * period * 1000) {
						tolerance += Math.floor(delay / (period * 1000)) - 1;
					}
					delays.push(delay);
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
				expect(observers["A"].callCount).to.equal(halfTickCount + 1 - tolerance);

				expect(observers["B"].callCount).to.equal(totalTickCount - tolerance);

				// +1 for the "stop" event
				expect(observers["C"].callCount).to.equal(totalTickCount + 1 - tolerance);

				// Verify it is well paced (here we expect no drifting so maybe the period shall b updated if too optimistic)
				tickTimes.forEach(function(tickTime, index) {
					var delay = delays[index];
					var lowLimit = beginning + index * period * 1000 + delay;
					var highLimit = lowLimit + period * 1000 + delay;
//console.log([lowLimit, highLimit], tickTime, delay);
					expect(tickTime).to.be.aboveOrEqual(lowLimit);
					expect(tickTime).to.be.below(highLimit);
				});

				proceed();
			}, (duration + clock.period / 2) * 1000);

			this.timeout((duration + 1) * 1000);
		});

		it("should catch up if it got delayed", function(proceed) {
			var period = 0.02;
			var clock = new Clock({period: period});

			var observers = {
				"A": spy(),
				"B": spy()
			};

			clock.on("tick", observers["A"]);

			var beginning = Date.now();
			var blockingDelay = 1;

			clock.once("tick", function(tickTime) {
				process.nextTick(function() {
					expect(Date.now()).to.be.above(afterBlocking);

					setTimeout(function() {
						expect(observers["A"].callCount).to.be(3);
						expect(observers["B"].callCount).to.be(3);
						expect(observers["B"].args[2][0]).to.be.above(tickTime + (blockingDelay + period) * 1000);
						expect(observers["B"].args[2][0]).to.be.below(tickTime + (blockingDelay + 2 * period) * 1000);

						proceed();
					}, period * 1000 + 1);

					var elapsedTime = Date.now() - beginning;
					expect(elapsedTime).to.be.above(blockingDelay * 1000);
					expect(elapsedTime).to.be.below((blockingDelay + period) * 1000);

					expect(observers["A"].callCount).to.be(1);
					// At that point, observer B was notified about the same event as observer A.
					expect(observers["B"].callCount).to.be(1);
					expect(observers["B"].args[0][0]).to.be(tickTime);
				});

				expect(observers["A"].callCount).to.be(1);
				expect(observers["A"].args[0][0]).to.be(tickTime);
				// Observer B was attached after current function was...
				expect(observers["B"].callCount).to.be(0);

				var beforeBlocking = Date.now();
				block(blockingDelay);
				var afterBlocking = Date.now();
				expect(afterBlocking - beforeBlocking).to.be.above(blockingDelay * 1000);
			});

			clock.on("tick", observers["B"]);

			clock.start();
		});
	});

	describe("not in \"steady\" mode", function() {
		it("should drift as much as observers take time", function(proceed) {
			var period = 0.25;
			var clock = new Clock({period: period});

			var duration = 3;

			var observers = {
				"tick": spy(function(tickTime, delay) {
					if(tickTime > startTime) {
						block(processingTime);
					}
				})
			};
			var startTime, nextTickTime, processingTime;

			clock.on("start", function(time) {
				startTime = nextTickTime = time;
			});

			clock.on("tick", function() {
				processingTime = Math.floor(Math.random() * 25) / 1000;
			});
			clock.on("tick", observers["tick"]);
			clock.on("tick", function(tickTime, delay) {
				if(tickTime > startTime) {
					var now = Date.now();
//console.log(now, nextTickTime, delay, processingTime);
					expect(delay).to.be.above(processingTime);
					expect(now).to.be.above(nextTickTime + processingTime);
				}
				nextTickTime += period * 1000;
			});

			setTimeout(function() {
				clock.stop();
				proceed();
			}, duration * 1000);

			clock.start();

			this.timeout((duration + 1) * 1000);
		});
	});
});

function block(delay) {
	var threshold = Date.now() + (delay * 1000);

	while(Date.now() <= threshold);
}

expect.Assertion.prototype.aboveOrEqual = function(n) {
	this.assert(
		this.obj >= n
		, function() {
			return "expected " + expect.stringify(this.obj) + " to be above or equal " + n
		}
		, function() {
			return "expected " + expect.stringify(this.obj) + " to be below " + n
		});
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