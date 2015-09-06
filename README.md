# Hortator

Simple clock that cares about time... but doesn't really care about your business!

> "Hortator" is a Latin word which, in the Old Rome, designated the slave runner who was giving rowing beats on the Roman [triremes](https://en.wikipedia.org/wiki/Trireme) to communicate to the slave rowers the speed the captain wanted.


## Usage

```javascript
var Clock = require("hortator");

var clock = new Clock({period: 0.5}); // seconds

clock.on("tick", function(tickTime, delay) {
	/* do your business */
});

clock.start();

// ...

clock.stop();
```