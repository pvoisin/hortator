var inherit = require("util").inherits;
var EventEmitter = require("events").EventEmitter;


function Clock(options) {
	var self = this, own = self;

	options = extend({
		period: 1, // seconds
		mode: "steady"
	}, options);

	own.period = options.period;
	own.mode = options.mode;
	self.running = false;

	EventEmitter.call(self);
}

inherit(Clock, EventEmitter);


Clock.prototype.start = function start() {
	var self = this, own = self;

	if(!own.timer) {
		var now = Date.now();

		own.timer = setImmediate(tick);

		self.running = true;
		own.startTime = now;
		var nextTickTime = own.startTime;

		self.emit("start", now);

		function tick() {
			var now = Date.now();
			var delay = now - nextTickTime;

			self.emit("tick", now, delay);

			nextTickTime += own.period * 1000;

			if(own.mode === "steady") {
				var remaining = own.period * 1000 - delay;
				// Here we got seriously delayed so let's catch up!
				if(remaining <= 0) {
					nextTickTime = now;
					own.timer = setImmediate(tick);
				}
				else {
					own.timer = setTimeout(tick, remaining);
				}
			}
			else {
				own.timer = setTimeout(tick, own.period * 1000);
			}
		}
	}
};

Clock.prototype.stop = function stop() {
	var self = this, own = self;

	var now = new Date();

	if(own.timer) {
		clearTimeout(own.timer);
		delete own.timer;

		self.running = false;

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