var inherit = require("util").inherits;
var EventEmitter = require("events").EventEmitter;


function Clock(options) {
	var self = this, own = self;

	options = extend({
		period: 0.01
	}, options);

	own.period = options.period;
	own.running = false;

	EventEmitter.call(self);
}

inherit(Clock, EventEmitter);


Clock.prototype.start = function start() {
	var self = this, own = self;

	if(!own.timer) {
		var now = Date.now();

		function tick() {
			self.emit("tick", new Date());

			var now = Date.now();
			var correction = now - nextTickTime;
			nextTickTime += own.period * 1000;

			var delayBeforeNextTick = own.period * 1000 - correction;
			if(delayBeforeNextTick <= 0) {
console.log("DELAYED!", delayBeforeNextTick);
				nextTickTime = now;
				delayBeforeNextTick = 0;
				// Here we got seriously delayed so let's tick as soon as possible...
				own.timer = setImmediate(tick);
			}
			else {
				own.timer = setTimeout(tick, delayBeforeNextTick);
			}
		}

		own.timer = setImmediate(tick);

		own.running = true;
		var startTime = own.startTime = now;
		var nextTickTime = startTime;

		self.emit("start", now);
	}
};

Clock.prototype.stop = function stop() {
	var self = this, own = self;

	var now = new Date();

	if(own.timer) {
		clearTimeout(own.timer);
		delete own.timer;

		own.running = false;

		self.emit("stop", now);
	}
};


function extend(object, source) {
	source && Object.keys(source).forEach(function(property) {
		object[property] = source[property];
	});

	return object;
}


module.exports = Clock;